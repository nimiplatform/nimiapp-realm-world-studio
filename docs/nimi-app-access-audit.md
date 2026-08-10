# Realm World Studio — Nimi App Access 对接审计(第一阶段,只读)

- 审计日期:2026-08-07
- 平台参考:`/Users/snwozy/nimi-realm/nimi` @ 分支 `spec-4`(HEAD `b4fa5f045`),全程只读
- 参照 App:`nimi/apps/tester`(canonical)、`nimi/apps/zhiyu`(产品范例)
- 本阶段未修改任何文件;`/Users/snwozy/nimi-realm/nimi` 与 `.nimi/spec/**` 保持只读

## 0. 契约事实校正(对任务简报)

简报称可用操作"恰好 14 行"。平台唯一生产 map `nimi/runtime/internal/localappop/contract.go:91-112` 实际为 **20 行**(5 Base + 15 AppAccess),`validateContractRows` 硬校验 "expected twenty rows"(`contract.go:160`)。差异在简报遗漏了第 4 个 domain **`agent.configure`** 的 6 个操作(`runtime.agent.ai-config.{get,overwrite}`、`runtime.agent.autonomy.{snapshot.get,update}`、`runtime.agent.presentation.{snapshot.get,commit}`,`contract.go:106-111`)。封闭 domain 集为 `realm.data / runtime.consume / agent.local / agent.configure`(`contract.go:97-111`;app-tools 侧同一封闭表 `nimi/app-tools/lib/app-access-declaration.mjs:3-8`)。

对本审计无实质影响:realm-world-studio 的最小声明集仍然只需要 `realm.data`(见 §4)。

## 1. 现状盘点

### 1.1 依赖与工具链

| 项 | 现状 | 参照(tester/zhiyu) | 差距 |
|---|---|---|---|
| `@nimiplatform/kit` | `link:../../nimi/kit`(`package.json:67`) | `workspace:*` | 外部仓库无法用 `workspace:*`;`link:` 绑定单机绝对路径,他机/CI 不可复现 |
| `@nimiplatform/sdk` | `link:../../nimi/sdks/typescript`(`package.json:68`) | `workspace:*` | 同上 |
| `@nimiplatform/app-tools` | `link:../../nimi/app-tools`(`package.json:41`) | `workspace:*` | 同上;app-tools 已具发布形态(v0.2.0,`publishConfig.access: public`,`nimi/app-tools/package.json`) |
| `@nimiplatform/kit-protected-local-win32-x64` | `link:../../nimi/kit/shell/protected-local-node/npm/win32-x64`(`package.json:42`) | tester 无此直接依赖 | 在本机(macOS)声明 win32 native 包,意图存疑,待确认是否为 kit optionalDeps 解析所需 |
| `@nimiplatform/nimi-coding` | published `0.4.0`(`package.json:44`) | tester 用 `0.5.0` | 落后一个 minor |
| sdk/kit 解析方式 | **双轨**:Vite 走源码 alias(`vite.config.ts:63-89` 直指 `../../nimi/sdks/typescript/*.ts` 与 `kit/*/src/*.ts`);`tsc`/Electron 构建走 `node_modules` link → 包 exports 指向 `dist/`(sdk 0.6.0 exports `"import": "./dist/index.js"`) | tester 用 monorepo 包装器 `nimi/scripts/with-workspace-surfaces.mjs`(先构建 sdk/kit dist 再执行命令) | 本仓库**没有** dist 准备步骤;`pnpm typecheck`/`build:electron` 隐式依赖 nimi 仓库 dist 已被人工构建。源码 alias 与 dist 双轨还存在源/产物漂移风险 |
| dev 启动 | `dev` = `nimi-app dev --shell electron`(`package.json:12`),已接 Desktop 监督启动 | 同(`apps/tester/package.json:7`) | 无差距 |
| 端口 | 1451(`package.json:13`、`vite.config.ts:130`、`nimi.app.yaml:11`),strictPort | tester 1468 / zhiyu 1472 | **1451 独占、无冲突,保留**。strictPort 竞态是已知平台问题,接受 |

### 1.2 Manifest 与启动

- `nimi.app.yaml`:`profile: standalone`、`manifest_role: submitted-input` 已具备;**`permissions: []`(:8)是旧权限平台遗物,需替换为 `app_access`**;`local_development.electron.renderer_origin: http://127.0.0.1:1451`(:9-11)符合新契约形状。
- `.nimi/admission/submission.yaml`、`build-profile.yaml` 角色标记齐全;`scripts/validate.mjs:16-21` 锁定了 `dev_command`/`dev_shell_command` 标记,`scripts/pack.mjs:14-28` 锁定 manifest 角色与 app_id——改造 manifest 时需同步保持这些自检通过。
- Electron 主进程 `src-electron/main.ts:28-33` 已用 `registerNimiElectronAppBridge`,**但携带已被平台删除的 `onProtectedSessionFailure: () => app.quit()`(:32)**。当前 kit(`nimi/kit/shell/electron/src/main/app-bridge.ts:20-31`)只接受 `{appId, allowedRendererUrls, ipcMain, appCommandHandlers?}` 四个字段,未知键抛 `electron-local-app-bridge-input-forbidden`(`app-bridge.ts:133-153`)。**即:对着 spec-4 的 kit,本 App 现在启动即 fail-closed 抛错**,这是最硬的失配点。且 `app.quit()` 本身是"access 丢失导致 App 退出"的自杀姿态,违反新语义纪律(删除后的正确姿势见 kit docstring `app-bridge.ts:33-41`:桥保持注册,同 Host 恢复)。

### 1.3 Renderer 对 nimi 表面的全部调用点(rg 枚举)

| 调用点 | 位置 | 说明 |
|---|---|---|
| `createNimiClient({ localApp: { standardShell } })` | `src/shell/renderer/app-shell/studio-platform.ts:16-20` | 唯一 client 入口,形状与 tester(`apps/tester/src/shell/local-app-runtime-platform.ts:9-14`)一致 |
| `client.auth.status()` | `src/shell/renderer/infra/studio-bootstrap.ts:55` | bootstrap 签入姿态 |
| `client.realm.worldCore.list` / `.create` | `src/shell/renderer/data/realm-client.ts:28-30` | 已在新表面上 |
| 10 个 `requireStudioProtectedOperation(...)` fail-closed 桩 | `src/shell/renderer/data/realm-client.ts:31-51` | get/replace/characters/entities/relationships,无新表面 |
| `createNimiLocalAppStandardShellSurface` 等桥 re-export | `src/shell/renderer/bridge/index.ts:5-20` | 干净,无 token 面 |
| `installNimiShellRuntimeBridge` / bootstrap loader | `src/shell/renderer/main.tsx:10,20,22-24` | kit 标准装配 |
| `@nimiplatform/sdk/realm[/generated]` 类型 | `world-core-client.ts:1`、`world-core-read-model.ts:1`、`worlds-pages.tsx:6`、`realm-client.ts:1` | 仅类型 |
| `@nimiplatform/kit/ui`、`/telemetry/error-boundary` | `App.tsx:4-5`、`main.tsx:9`、`worlds-pages.tsx:7-17`、`routes.tsx:4`、`shell-layout.tsx:5-13`、`auth-provider.tsx:4-10` | 纯 UI |
| 守护测试(禁止直连/旧面) | `src/shell/renderer/data/runtime-client.test.ts:10-44` | 主动防御,已是资产 |

未命中(grep 全 `src/`):`storage.*`、`aiConfig`、`ai.text`、`agents.*`、`conversation.*`、`currentUser.get` —— 这些新表面当前零使用。

### 1.4 Tauri 壳

`src-tauri/src/main.rs:5-25` 仍装 `nimi_shell_tauri` 的 `RuntimeBridgeAppHost` 与 installed-app standard shell handler —— first-party 时代的宿主胶水。活跃开发路径已是 Electron(`AGENTS.md` 架构表;`electron-host-contract.test.ts:10-32` 锁死 Electron-only)。Tauri 壳不在本次 App Access 对接路径上,处置(冻结/退役)需用户决策(见 §6 风险)。

## 2. 残留扫描

### 2.1 必须清除/改造(代码与配置)

| # | 残留 | 位置 | 类别 |
|---|---|---|---|
| R1 | `permissions: []` | `nimi.app.yaml:8` | 旧权限平台词汇;替换为 `app_access` |
| R2 | `onProtectedSessionFailure: () => app.quit()` | `src-electron/main.ts:32` | 已删除的 authority-shaped 字段 + 自杀式 session-loss;当前对 spec-4 kit 启动即抛 `electron-local-app-bridge-input-forbidden` |
| R3 | 测试锁死旧姿势 `expect(mainSource).toContain('onProtectedSessionFailure: () => app.quit()')` | `src/shell/renderer/bridge/electron-host-contract.test.ts:39` | 需翻转(tester 的对应回归测试是反向锁定:`apps/tester/test/tester-runtime-account-auth.test.mjs:61-66` 断言**不含**该字段) |
| R4 | 失败分类含 `permission-denied`/`revoked` 状态与旧 reason code 集 `runtime-permission-denied`/`local-app-permission-denied`/`local-app-permission-revoked` | `src/shell/renderer/app-shell/protected-session-state.ts:4-5,29-36,76-77` | 旧权限平台 taxonomy。新 SDK `auth.status()` 状态集为 `session-bound/action-required/revoked/project-changed/process-replaced/account-changed/runtime-restarted/unavailable`(`nimi/sdks/typescript/core/app/local-app-runtime-platform.ts:99-106`);未声明 domain 的拒绝码是 `local-app-access-denied`(`nimi/runtime/internal/services/app/local_app_session_kernel.go:301-302` → `nimi/kit/shell/protected-local/src/grpc_status.rs:174`) |
| R5 | 终端 UI 主告警区直接渲染 reason code | `src/shell/renderer/app-shell/auth-provider.tsx:59-61` + label `auth.protectedSession.reasonCode`(`i18n/resources.ts:130,322`) | 违反"机器码只进折叠技术区";zhiyu 的正确形态是折叠 `<details>` 技术诊断区(`apps/zhiyu/src/shell/runtime/runtime-unavailable-page.tsx:45-61`) |
| R6 | i18n 文案 permission/revoke 词汇(中英各 6 条) | `src/shell/renderer/i18n/resources.ts:139-144,331-336` | "Review the installed app permissions" 等指向已退休的权限平台 |
| R7 | 占位 reason `'world-studio-protected-operation-set-not-admitted'` / action `'wait_for_world_studio_protected_operation_admission'` | `src/shell/renderer/app-shell/studio-platform.ts:8-11` | "admission" 叙事属旧准入模型;fail-closed 行为本身保留,措辞需按新模型重述 |
| R8 | AccountMenu 使用硬编码 fallback 身份 | `src/shell/renderer/app-shell/shell-layout.tsx:66-67`(`displayName` 取 i18n 假名、`avatarUrl = null`) | 非违规,但新表面 `currentUser.get()`(Base,返回 `{handle, displayName, avatarUrl}`,`local-app-runtime-platform.ts:133-137`)可直接替换 |

### 2.2 文档层残留(本仓库可改)

- `AGENTS.md:80`(`permission-missing` 失败类目)、`AGENTS.md:95-108`(review 拥有 "permission grants"、"grant/approval semantics" 措辞)。
- `ADMISSION.md:3,24,32`("permission grant"、"empty permission set"、"permission grants")。
- `SECURITY.md:14-16`("Permission posture" 整节)。
- 注意:`scripts/local-audit.mjs:23-35,41-42` 依赖 ADMISSION.md 含 "not an approval"、`SECURITY.md` 含 "Desktop owns admission..." 两句——文档改写时必须保留这些标记句或同步改脚本。

### 2.3 只读区残留(仅登记,不修)

- `.nimi/spec/realm-world-studio/canonical/failure.authority.yaml:17-20`(definition `permission-missing`)、`:60,84`(failure taxonomy 含 `permission-denied`/`revoked`)、`core.authority.yaml:91-92`、`runtime-ai.authority.yaml:86` —— spec 层仍含旧权限平台词汇。红线规定 `.nimi/spec/**` 只读,登记为规范漂移项,由 spec 所有者处置。
- `docs/_archive/2026-07-23-pre-authority-spec/**` 多份归档文档含 permission 词汇 —— 历史归档,惰性,不处理。

### 2.4 零残留确认(grep 无命中)

- `SendAppMessage` / `agents.configure` / `localAgentId` / artifact put-read / voice 流:`src/` 全量无命中。
- 直连 Realm URL/credential:`fetch(` 仅命中 React Query refetch 回调(`worlds-pages.tsx:273,288,372`);无 Realm base URL、无 token 面;`runtime-client.test.ts:18-33` 主动守护这些禁令。
- durable agent handle 持久化:无 agents 使用,无持久化(storage 面零使用,App 数据当前不落地)。
- App 自杀式 session-loss:除 R2 外 renderer 侧无 `app.quit` 类逻辑;`studio-bootstrap.ts` 失败路径是展示态不退出,方向正确。

## 3. 映射表(现有能力 → 新契约)

| 现有能力 | 位置 | 新表面对应 | 处置 |
|---|---|---|---|
| bootstrap 签入(`auth.status()`) | `studio-bootstrap.ts:55` | `auth.status()`(Base) | **保留**;状态分类按新 state 集重映射(R4) |
| 世界列表 `worldCore.list` | `realm-client.ts:27-28` | `realm.worldCore.list`(AppAccess,`realm.data`) | **已在新表面**,声明 `realm.data` 即可转 positive |
| 世界创建 `worldCore.create` | `realm-client.ts:29-30` | `realm.worldCore.create`(AppAccess,`realm.data`) | **已在新表面**,同上 |
| 世界详情 `getWorldCore` | `realm-client.ts:31-32` | **无** | 产品缺口 G1,保持 fail-closed |
| 世界替换 `replaceWorldCore` | `realm-client.ts:33-34` | **无** | 产品缺口 G1(编辑页 `worlds-pages.tsx:601-717` 依赖) |
| 世界角色 list/get/create/replace | `realm-client.ts:35-42` | **无** | 产品缺口 G2(详情/编辑页 `worlds-pages.tsx:312-345,440-505,719-837` 依赖) |
| 世界实体/关系 list/get | `realm-client.ts:43-51` | **无** | 产品缺口 G3(当前 UI 未直接路由,仅读模型) |
| 账号菜单身份 | `shell-layout.tsx:66-67` | `currentUser.get()`(Base) | **可换**(R8,低成本改进) |
| session-loss 姿态 | `main.ts:32` + `auth-provider.tsx` | 桥保持注册 + `auth.status()` typed 态 + 同 Host 重试(zhiyu `auth-gate.tsx:54-56` 重探测模式) | **改造**(R2/R4/R5) |
| storage / aiConfig / ai.text / agents / conversation | —(零使用) | 新表面均存在 | **不声明、不接入**;domain 最小集 = `realm.data` 一项 |
| Tauri 壳宿主 | `src-tauri/src/main.rs:5-25` | 无(Electron 为活跃路径) | 决策项,见 §6 |

**结论:声明 `app_access: [realm.data]`。不声明 `runtime.consume` / `agent.local` / `agent.configure`。**

## 4. 缺口清单

### 4.1 产品缺口(新表面无对应,不许自造)

- **G1 — WorldCore get/replace**:契约只有 `realm.world-core.{list,create}`(`contract.go:97-98`)。Studio 核心编辑流(详情页、baseContentHash 替换写)无表面。过渡姿态:相关页面展示 typed unavailable(信息态),不伪成功、不直连。
- **G2 — WorldCharacter 全族**(list/get/create/replace):AGENTS.md 列为 Studio  canonical 面,但新契约无任何 world-character 操作。角色详情/编辑页全部缺口。
- **G3 — WorldEntity / WorldRelationship 读取**:同上。
- G1-G3 是平台契约面缺口,登记待平台路线图;App 侧不得 fallback 到 owner-persona 或直连 Realm(AGENTS.md Hard Boundaries 已禁)。

### 4.2 工具链缺口

- **T1 — sdk/kit/app-tools 消费形式未定**:`link:../../nimi/*` 仅本机可用。选项:
  - A(短期,推荐):保留 `link:`,新增等价于 `with-workspace-surfaces.mjs` 的本地 prepare 脚本(构建 `../../nimi` 的 sdk/kit dist 后再 typecheck/build/test),消除隐式依赖;Vite 源码 alias 与 dist 双轨需明确唯一真源(建议 typecheck 也走源码 paths,或统一走 dist)。
  - B(中期):待 `@nimiplatform/sdk` / `kit` 发布 npm 版本后改 published 依赖(app-tools 已具发布形态)。tester/zhiyu 是 monorepo 内 App,覆盖不到此场景,无现成范例。
- **T2 — `@nimiplatform/nimi-coding` 0.4.0 → 0.5.0** 对齐 tester。
- **T3 — `@nimiplatform/kit-protected-local-win32-x64` link 依赖**(`package.json:42`)在 macOS 开发机上的必要性待确认;若仅为其 optionalDeps 解析,应记录原因或移除。

### 4.3 平台/规范侧缺口(只登记,不跨仓库修)

- **P1 — 简报与契约不一致**:14 行 vs 实际 20 行(§0)。
- **P2 — `.nimi/spec/realm-world-studio/canonical/**` 仍含 permission 词汇**(§2.3),与本任务新模型漂移;红线只读。
- **P3 — `realm.worldCore.list` 的 `take` 在 SDK/kit/runtime 三层均无上限校验**(SDK 仅 safe-integer ≥0,`local-app-runtime-platform.ts:531-540`)—— 非阻塞,登记。
- **P4 — Tauri 壳路径无 App Access 故事**:活跃路径 Electron-only,Tauri 宿主胶水属 first-party 遗物。

## 5. 适配改造计划(第二阶段,分 checkpoint)

每 checkpoint 结束保持 `pnpm typecheck && pnpm test` 绿;`pnpm run check` 在 CP5 后全绿。

- **CP1 工具链与 manifest**
  - `nimi.app.yaml`:`permissions: []` → `app_access: [realm.data]`;同步 `scripts/validate.mjs`/`scripts/local-audit.mjs`/`scripts/pack.mjs` 使自检继续通过(app_id、角色标记不变)。
  - `package.json`:决定 T1 选项(默认 A:新增 `prepare:workspace-surfaces` 本地脚本 + 文档化);`nimi-coding` 升 0.5.0;端口 1451 不变。
- **CP2 Electron bridge**
  - `src-electron/main.ts:28-33` 删除 `onProtectedSessionFailure`,字段集收敛到 `{appId, allowedRendererUrls, ipcMain}`。
  - 翻转 `electron-host-contract.test.ts:39` 为反向断言(对齐 tester `tester-runtime-account-auth.test.mjs:61-66`)。
  - 验证:`pnpm build:electron` + 对 spec-4 kit 启动不再抛 `electron-local-app-bridge-input-forbidden`。
- **CP3 session 姿态重写**
  - `protected-session-state.ts`:分类改为新 state/reason 集(`action-required / revoked / project-changed / process-replaced / account-changed / runtime-restarted / unavailable / local-app-access-denied`),删除 permission taxonomy。
  - `auth-provider.tsx`:reason code 移入折叠技术区;失败态提供"重新检查"按钮走同 Host 重试(复用现有 `runStudioBootstrap({force:true})`,`studio-bootstrap.ts:15-17` 已支持)。
  - `i18n/resources.ts`:R6/R7 文案按新模型重写(信息态、无 permission/approval 词汇)。
  - 同步更新 `protected-session-state.test.ts`、`studio-bootstrap.test.ts`、`auth-provider.test.tsx`。
- **CP4 能力面收窄与缺口姿态**
  - `realm-client.ts`:list/create 直通;无对应表面的 10 个方法维持 fail-closed,但错误文案去 admission 化(R7)。
  - `worlds-pages.tsx`:G1/G2 依赖页(详情/编辑)在 typed unavailable 下呈信息态文案(首次/未配置不用告警色)。
  - 可选:`shell-layout.tsx` AccountMenu 换 `currentUser.get()`(R8)。
- **CP5 文档与词汇**
  - `AGENTS.md`/`ADMISSION.md`/`SECURITY.md` 去 permission 词汇、按 App Access 模型重写;保留 `local-audit.mjs` 要求的标记句(或同步改脚本)。
  - 本审计报告归档;`.nimi/spec` 漂移项(P2)仅记录,不改。
- **CP6 真实 journey 验收**(前置:backend `pnpm dev` :3002 与 nimi `pnpm dev:desktop` 在跑,账户 `@halliday` 已登录)
  - `nimi-app dev --shell electron -- --cdp-port <空闲端口>` 启动;CDP 只挂本 App 精确 target。
  - 观察:签入姿态(session-bound);`realm.data` positive(list + create 各一);未声明操作 typed denial(renderer 侧对 `agents.listReferences()` 或 `ai.text.generateCandidate` 的拒绝应为 `local-app-access-denied`,以 tester 探针语义为准);杀 source Runtime 进程 → typed unavailable(`runtime-restarted`)→ 同 Host 恢复;显式退出清理。
  - 诚实记录 `not_observed`;报告写回本仓库 `docs/`,不进 nimi 平台仓库。

## 6. 风险

1. **当前主进程对 spec-4 kit 必炸**(R2):`pnpm dev` 现在应起不来,说明本仓库已落后于平台硬切。CP2 前任何 journey 都无从谈起。
2. **G1/G2 是 Studio 的核心产品流**(世界编辑、角色管理):契约面只有 list/create 意味着适配后 App 仍是"列表 + 创建"的削足适履形态。需要用户确认接受此过渡形态,或先与平台对齐契约路线图再动手。
3. **`link:` 依赖不可移植**(T1):换机/CI 即断;且 vite 源码 alias 与 dist 双轨可能消费到不同版本事实。
4. **Tauri 壳去留**(§1.4):保留则维护一份不走 App Access 的宿主胶水,删除则是仓库级决策 —— 需用户拍板。
5. **spec 漂移**(P2):canonical spec 与实现将长期不一致,直到 spec 所有者更新;`pnpm check:spec-consistency` 目前仍绿(spec 自洽),但语义已旧。
6. **strictPort 竞态**(已知平台问题):1451 被占时 dev 直接失败,无可自动恢复路径,接受。

## 7. 引用自检(写完后 re-grep 抽查 5 条)

全部通过(2026-08-07,`sed -n` / `grep -n` 实地复核):

1. `src-electron/main.ts:32` → 逐字命中 `onProtectedSessionFailure: () => app.quit(),` ✅
2. `nimi.app.yaml:8` → 逐字命中 `permissions: []` ✅
3. `protected-session-state.ts:29-36` → 命中 `runtime-permission-denied` / `local-app-permission-denied` / `local-app-permission-revoked` 三个旧 reason code ✅
4. `nimi/runtime/internal/localappop/contract.go` → `validateContractRows` 于 :158-160 硬校验 "expected twenty rows";表首行 :92 为 `runtime.app-storage.json.read`(Base),末行 :111 为 `runtime.agent.presentation.commit`(`agent.configure`)✅
5. `nimi/kit/shell/electron/src/main/app-bridge.ts` → 输入类型仅 `appId`(:21)/`allowedRendererUrls`(:22)/`ipcMain`(:23)/`appCommandHandlers?`(:30);:149 抛 `electron-local-app-bridge-input-forbidden` ✅
