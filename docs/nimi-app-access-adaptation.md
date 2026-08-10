# Realm World Studio — Nimi App Access 适配报告(第二阶段)

- 日期:2026-08-07
- 前置:`docs/nimi-app-access-audit.md`(第一阶段审计,用户已确认)
- 用户决策:① 接受过渡形态(G1/G2 编辑流呈 typed unavailable);② Tauri 壳冻结、不退役
- 红线遵守:`/Users/snwozy/nimi-realm/nimi` 与 `.nimi/spec/**` 全程未改一字;平台仓库内仅执行过其自身定义的 sdk/kit dist 构建(消费所需,且本次实际无需重建);未登出、未触碰 Desktop(9333)与任何 owner UI;CDP 只挂本 App 精确 target(URL 前缀 `http://127.0.0.1:1451/` 的 page);未建 harness/fixture/录制系统(CDP 驱动为 /tmp 一次性脚本,已删除)

## 1. 改造清单(按 checkpoint)

### CP1 工具链与 manifest
- `nimi.app.yaml:8`:`permissions: []` → `app_access: [realm.data]`(最小集;storage/aiConfig/ai.text/agents/conversation 零使用,不声明 `runtime.consume`/`agent.local`/`agent.configure`)。
- `scripts/prepare-workspace-surfaces.mjs`(新增):外部仓库消费 `link:../../nimi/*` 时,sdk/kit 的 package exports 指向 `dist/`;该脚本在 dist 缺失或落后于源码时,在 `../../nimi` 执行平台自身的 `pnpm --filter @nimiplatform/{sdk,kit} build`(tester 的 `with-workspace-surfaces.mjs` 的外部仓库等价物)。已链入 `typecheck` 与 `build:electron`(`package.json:19,22`)。
- `@nimiplatform/nimi-coding` 0.4.0 → 0.5.0(对齐 tester);0.5.0 移除了 `authority check --require-format`,`spec:authority:check` 脚本已同步。
- `scripts/validate.mjs`:新增断言 manifest 必须含 `app_access` + `realm.data`,且不得再出现 `permissions:` 字段。
- 端口 1451 保持(tester 1468 / zhiyu 1472,无冲突)。

### CP2 Electron bridge
- `src-electron/main.ts:28-33`:删除 `onProtectedSessionFailure: () => app.quit()`;注册收敛为 `{appId, allowedRendererUrls, ipcMain}` 三字段。此前形态对着 spec-4 kit 必抛 `electron-local-app-bridge-input-forbidden`(kit `app-bridge.ts:133-153` 拒绝未知键)。
- `electron-host-contract.test.ts`:翻转为反向断言(不含 `onProtectedSessionFailure` / `supervised-host-reopen`),对齐 tester 回归测试语义。

### CP3 session 姿态
- `protected-session-state.ts`:taxonomy 换新 —— `action-required / runtime-unavailable / access-denied / session-ended / repair-required / capability-unavailable`;旧 `permission-denied`/`revoked`(权限平台义)分类及 `runtime-permission-denied`/`local-app-permission-denied`/`local-app-permission-revoked` reason 集删除,新增 `local-app-access-denied` 一族与 `runtime-restarted`/`presence-expired` 等。
- `auth-provider.tsx`:reason code/actionHint 移入折叠 `<details>` 技术区(主告警区不再出现机器码);新增"重新检查"按钮走 `runStudioBootstrap({force:true})` 同 Host 重试。
- `studio-platform.ts`:fail-closed 占位 reason/action 去 admission 化(`world-studio-operation-not-in-app-access` / `wait_for_platform_app_surface`)。
- `i18n/resources.ts`:permission/revoke/准入 文案全部重写(中英),新增 access-denied、session-ended、technicalDetails、recheck 键。
- 三个测试文件同步更新;新增 access-denied 姿态与折叠技术区断言。

### CP4 能力面
- `realm-client.ts`:list/create 直通新表面;其余 10 个方法保持 fail-closed(措辞随 CP3 更新)。G1/G2/G3 页面在 typed unavailable 下呈信息态(过渡形态,用户已确认)。
- `shell-layout.tsx` AccountMenu:硬编码 fallback 身份 → `currentUser.get()`(Base,仅 `{handle, displayName, avatarUrl}`),失败时回落中性文案;新增 `current-user.ts` + 测试。

### CP5 文档层
- `AGENTS.md`:架构表修正(link: 依赖形态、Tauri 冻结)、`permission-missing` → `access-denied` 示例、Reviewer boundary 与 admission 编辑规则按 App Access 重写、补 `prepare:workspace-surfaces` 验证步骤。
- `ADMISSION.md` / `SECURITY.md`:去 permission 词汇;"Permission posture" 节改为 "App Access posture";`local-audit.mjs` 要求的标记句原样保留。
- `.nimi/spec/**` 内 permission 词汇:红线只读,仅登记(审计报告 §2.3 / P2),未改。

## 2. 验证

`pnpm run check` 全绿(doctor / validate / local-audit / spec-consistency / i18n:check / i18n:audit / typecheck / lint / test 64 过 / build:electron / build:renderer / pack)。

## 3. 真实 journey 观察表

环境:backend :3002(PID 32519)与 `pnpm dev:desktop`(Electron PID 47458,账户 `@halliday` 已登录)在跑;Runtime 由 Desktop 监督(`nimi-runtime serve`,初始 PID 88921,PPID 47458)。启动:`pnpm dev -- --cdp-port 9666`(即 `nimi-app dev --shell electron -- --cdp-port 9666`);CDP 只挂 `http://127.0.0.1:1451/` 的 page target。

| # | 观察项 | 方法 | 结果 |
|---|---|---|---|
| J1a | 签入姿态 | 页面无 `[data-testid="world-studio-protected-session-failure"]`;桥 `nimi.shell.localApp.sessionStatus` 返回 `{state: ready, currentUser: {@halliday, Halliday}}` | ✅ session-bound |
| J1b | `realm.data` positive:list | 世界列表渲染 14 张 `.rws-world-card` | ✅ |
| J1c | Base positive:currentUser | 账号菜单显示 `Halliday` / `@halliday`(走 CP4 新接的 `currentUser.get()`) | ✅ |
| J2 | `realm.data` positive:create | 经 UI 表单创建 `RWS AppAccess Journey Probe`,toast 确认,列表出现,id `01KZEZP3M8NE75EECQCMVXCP07`,卡片 14→15 | ✅(该世界留在 @halliday 账户下,无删除表面) |
| J3 | 未声明操作的 typed denial | 经真实桥调 `nimi.shell.localApp.agentReferenceList`(`agent.local` 未声明)→ 拒绝 `reasonCode: local-app-access-denied`,`actionHint: refresh_local_app_runtime_projection`,`retryable` 字段在;App 不退出 | ✅(注:错误对象 `code` 字段为平台 gRPC 侧字符串 `runtime-permission-denied`,属平台内部命名,非本仓库词汇) |
| J4a | Runtime 丢失 → typed unavailable | kill Runtime(88921);窗口期桥 `sessionStatus` 返回 `runtime-service-unavailable` / `start_fixed_runtime_service`;第二次复现抓到 UI:面板 `data-protected-state="runtime-unavailable"`,标题"Nimi Runtime 服务不可用",技术详情 `<details>` 默认折叠(reason code 仅在其中),"重新检查"按钮在,App 未退出 | ✅ |
| J4b | 同 Host 恢复 | Desktop 数秒内 respawn Runtime(9415→9668→9793,PPID 均为 47458);首次 kill 后甚至无需手动干预即自动重绑(sessionStatus 直接 ready);点"重新检查"后面板消失,15 张世界卡片含 J2 探针世界 | ✅ 同 Host;App 进程全程未重启 |
| J4c | 缺口姿态(过渡形态) | 打开探针世界工作台(`getWorldCore` 无表面)→ "世界工作台不可用" + typed 文案,非告警色,有重试 | ✅(附注:该 typed 错误 message 为英文 SDK 文案,中英混排,记为已知瑕疵) |
| J5 | 显式退出清理 | 停止 dev 任务;3s 后 1451/9666 均释放,无残留 App Electron 进程;Desktop 监督的 Runtime(9793)按归属继续运行;未登出 | ✅ |
| — | storage / ai.text / agents / conversation positive | 未声明这些 domain,按最小集原则无对应功能可观察 | `not_observed`(有意) |
| — | `ai-connector-grant-selection-required` | 本 App 不消费 AI 面 | `not_observed` |

## 4. 残留风险与后续

1. **G1/G2/G3 产品缺口**(world get/replace、character、entity/relationship 无 App Access 表面)——过渡形态已上线,待平台契约路线图;不得自造。
2. **`link:` 依赖不可移植**:CI(`.github/workflows/ci.yml`)不 checkout 平台仓库,`pnpm install` 在 CI 上无法解析 `link:../../nimi/*` —— 登记为已知限制,根治等 sdk/kit published 版本(审计报告 T1 选项 B)。
3. **`@nimiplatform/kit-protected-local-win32-x64` link 依赖**(T3):保留——`kit` 以 `workspace:*` optionalDependencies 声明 protected-local 原生包(`nimi/kit/package.json:385-388`),外部 link 消费需在本仓库显式承接;当前形态可装可构建。
4. **Tauri 壳冻结**:仍可被 `cargo check` 编译,但不走 App Access;活跃路径 Electron-only。
5. **`.nimi/spec` 词汇漂移**(P2)与契约行数简报差异(14 vs 20,P1):均已登记,归平台/spec 所有者。
6. **i18n 瑕疵**:世界缺口页的 typed 错误 detail 为英文 SDK message(J4c),后续可将该类错误的展示文案本地化。

## 5. 引用自检(写报告前 re-grep 抽查 5 条,全部通过)

1. `src-electron/main.ts:28-33` → 三字段 `registerNimiElectronAppBridge`,无 `onProtectedSessionFailure` ✅
2. `nimi.app.yaml` → `app_access:` + `- realm.data`,无 `permissions:` ✅
3. `auth-provider.tsx:68-93` → `<details>` 技术区 + `auth.protectedSession.recheck` ✅
4. `protected-session-state.ts:32` → `local-app-access-denied` 在 ACCESS_DENIED_REASONS ✅
5. `package.json:12,19,22,45` → `prepare:workspace-surfaces` 脚本与链入、`nimi-coding 0.5.0` ✅
