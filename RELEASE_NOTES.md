## 0.1.6 · Published platform dependencies

Uses public npm SDK 0.21.0, Kit/native 0.19.3, App Tools 0.12.1 and nimi-coding 0.6.5 with frozen registry lockfiles. Local Nimi tarball overrides are removed; Desktop-supervised development and installed Apps use the same published carrier.

# Realm World Studio 0.1.6 · 早期开发记录

> 以下保留该版本早期候选的功能与验证记录，依赖组合描述的是当时环境。当前依赖以本页顶部的 Published platform dependencies 及仓库锁文件为准；依赖升级本身不代表下方未验证流程已重验。

AI 共创生成的提案会作为待审阅事项出现在 Nimi 首页及其他可读取应用活动的应用中，点开即可回到对应草稿；完成审阅、替换提案或删除草稿后，事项会同步更新为已完成或已取消。事项只包含世界名称、任务类型和数量摘要，不包含草稿正文或 AI 候选内容。草稿保存成功后才会同步事项；未能同步时会提示并可立即重试。Nimi 会话变化（例如切换账户）时，Studio 会停止当前工作并请你重新打开。本版本改用 SDK 0.16 / Kit 0.12 配对并新增 `app.activity` 声明；发行与 Catalog 准入独立进行。

# Realm World Studio 0.1.5

补充受众、AI 文字输出及经用户确认公开世界资料的事实声明，供支持该字段的 Nimi 展示。保留 SDK 0.11 / Kit 0.7 配对；不新增业务能力或运行门禁。发行与 Catalog 准入独立进行，声明不构成安全认证。

# Realm World Studio 0.1.4

本次候选版本接入 Nimi App v2 发行信息协议：

- 随安装包提供应用图标、简介、使用说明、版本说明和许可证。
- 携带应用已声明的 App Access、能力需求与存储方式。
- 提供与包内同字节的信息资产，供 Nimi 在安装前展示应用信息。

此文件是当前源码候选的版本说明；正式发布与 Registry 审核是独立步骤。
