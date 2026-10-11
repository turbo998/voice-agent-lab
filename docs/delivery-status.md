# 阶段交付状态

更新时间：2026-10-11。**基础私网与预算已部署，无云应用运行时；不声称真实语音通过。**

## 已实现

中文运营 UI、原创合成产品/客户/订单/知识、六个严格 schema 业务工具、
会话隔离、运营审批与撤销、幂等工单和仅计划型回访。运营登录使用密码
哈希与安全 cookie，不是 Entra SSO。

Retell 原生流程生成器、固定版本发布脚本、服务端 REST/信令/字幕代理、
持久化签名事件 inbox、有限重试/毒事件处理、主管接管不确定状态隔离。
Foundry Prompt Agent/Search 配置代码与严格引用校验。独立 MIT GPT Live
导入及不影响原始本地配置向导的受保护云入口。
GPT Live 云界面提供运营审批入口，创建会话后携带服务端业务会话ID；
运营页登录后按所有者授权恢复客户、订单与草稿，不把URL当作授权。
成本与语音门禁定时刷新，操作后再次刷新；云语音未验证时连接按钮关闭。
正常退出会等待最终持久化结算，失败或超时明确报错并保留费用预留。
启动恢复会对账本中明确关联的非终态Live会话有界attach/close，
不续用模型或业务写权限；未知ID/旧记录缺费率/缺最终用量保持不确定。
按创建时保存的费率与expiry范围结算，后续配置变化不重算旧通话。
这些路径已通过本地模拟供应商回归，不等于真实供应商恢复已完成。

## 实际观察

| 检查 | 结果 | 不能据此推断 |
|---|---|---|
| 主应用离线测试 / 合成评估 | 66项 / 6场景通过；包括bootstrap加密、运行窗口及停用控制回归 | 真实麦克风/供应商服务通过 |
| TypeScript / 生产构建 | 通过；JS bundle 有体积警告 | 公网服务已经部署 |
| GPT Live 原始测试 / 发布扫描 | 33 项通过 / 通过 | Azure Live 协议实际鉴权通过 |
| 实际浏览器 | 运营页恢复会话/客户订单、预算刷新；GPT云页中英切换、草稿及独立语音语言保留、关闭的语音门禁 | 模拟配置可替代真实供应商/人声验收 |
| Retell scoped agent-list | 一次非付费 API 鉴权成功 | 余额、完整费率或真实 webhook 已验证 |
| SEA ACA 新环境 CPU 配额 | Consumption cores limit 500 / used 0 | 合规私网拓扑已经配置 |
| Search inventory | 尚未创建；provider 已注册 | Free SKU 的数据面/原生工具已可用 |
| 实际基础资源 | 首次基础部分部署；随后观察到源关联Storage Event Grid system topic，归因/计费未证实 | 所有新增服务都是应用创建或没有费用 |
| 批准的私网阶段 | Provider预检16Create/9Ignore；实际部署Succeeded，3PE均Approved，3DNS各1A记录/VNet link Completed，外部Consumption新环境接委派子网 | 私网job已实际解析/连接Storage和KV |
| 托管网络费用资源 | 实际1个Standard Regional LB、2条规则、1个Standard Regional Static IPv4；原空环境保留 | 固定费用会随app关闭消失 |
| 实际预算 | USD150/月、仅lab及其ACA托管RG；Actual金额75/100/120、各1个用户批准的私密收件人 | 告警已触发/送达，或预算是硬停止 |
| 实际网络治理 | Storage/KV 公网 Disabled；资源活动日志确认 modify Policy | 可以重新启用公网或绕过组织治理 |
| GitHub Actions 镜像 | 实际 offline/build/publish 成功，匿名 manifest 200 | 当前后续修改已包含于镜像 |
| 私网 bootstrap | 新 binding 的 init 与一次性 leased commit 均 Succeeded；四项 KV secret 版本元数据确认，Blob CAS/私网 MI 访问通过 | 应用已启动或真实供应商调用通过 |
| 实际 ACA secret 引用 | 四项 versioned KV 引用已解析，有限 probe 返回 count4、容器 exit0；execution 状态仍 Failed，原因尚未归因 | 可以把容器输出冒充整个 execution Succeeded |
| 临时配置清理 | 两个临时 job 名均不存在；三项具体临时授权及 MI 实际计数均0；Storage/KV仍 Disabled | 删除 live key 等同物理擦除；Storage软删除保留7天 |
| 运行时私网权限 | 有限 execution Succeeded：4KV引用/control读/BlobCAS/Queue；control写与bootstrap读均403 AuthorizationPermissionMismatch | 控制器已经具备实际停用权限 |
| 窗口管理 | 私网 CAS block execution Succeeded，blocked=true/windows0；临时管理及access job/写授权/MI已清理确认0 | 已开放窗口或应用活跃 |
| 独立停用预检 | zero-replica/no-ingress shell Provider拒绝：maxReplicas必须大于0；未创建app | 可以擅自改为max1或RG-wide停用权限 |

## 仍需完成

已生成并编译固定 AVM Bicep，增加容器与离线 CI/可选镜像发布定义；
空计算基础阶段的 Provider ARM validation 与 what-if 已通过（25项 Create，
无修改/删除/未解析项）；第一次部署暴露 Foundry 身份跨模块提前读取的
依赖问题，资源已部分创建。已修正模块边界，窄范围 Search Provider 预检通过
（5项Create；既有8项Ignore而非修改），尚未创建 Search；
不将整套模板重放并覆盖组织设置。受治理约束的应用部署与数据面
验证、Retell 原生服务配置/固定版本、实际计量映射、shutdown 后恢复、
GPT 会话与运营审批页面关联的真实跨应用/供应商验收、原创视频资产。
真实麦克风及公开人声音频需用户参与/同意，模拟测试不能替代。

Retell 控制台登录已过期，最近一小时余额/无付款/无充值状态未能重新核验；
不刷新历史观察时间，不解除真实通话门禁。指定 signer 的真实回调亦未验证。

用户已批准受限POC档：每app≤100活跃小时/月、所有worker≤30小时/月、
模型≤USD30/月，估算USD119.21含20余量，不是硬cap。
实际私网部署保留Storage/KV Disabled、shared-key false/RBAC true。
私网一次性MI bootstrap、四项KV配置及暂时权限回收已实际完成。
下一阶段必须验证运行窗口、独立revision停用及窄范围运行时身份权限，
再部署应用。离线RSA-OAEP/AES-GCM封装回归已通过绑定、过期、
篡改/非白名单拒绝；旧过期binding没有延长或复用。
CLI没有app stop/start命令；官方生命周期文档确认revision deactivate会
关闭容器。具体独立控制器权限、调度和实际停用仍待实现/验证。

## 治理

所有变更仅在隔离 worktree；未修改原 GPT Live repository。
Azure 只读发现了既有资源范围的六项系统 deny，不能据此排除管理组继承
Policy/deny。无法读取的继承策略仍是未知，必须以获授权的验证和实际部署
结果确认；不修改治理、不放松网络、不自动升级付费 SKU。
本次资源活动日志可读取，已确认两项公网 modify 效果；完整继承定义
不可见与 Policy state 尚无记录的问题仍保留，不等同全策略通过。

## 实际镜像来源

[成功构建与发布运行](https://github.com/turbo998/voice-agent-lab/actions/runs/38109652735)
对应源码 `874db2b267aa0cdab2bbb538db68f75dd50054c2`，而非后续代码或文档提交。

```text
ghcr.io/turbo998/voice-agent-lab@sha256:69f12d7825c7585b285f936211fbc7f8720cd4f7daa2e7679fcf3c380f0d04e4
```

匿名 registry manifest 返回 HTTP200；没有通过假 digest、示例镜像或仓库
CI定义替代发布验收。该镜像已运行私网权限与CAS控制任务；尚无应用启动验收。
包含运行窗口服务入口接线；后续helper IaC不是该镜像源码。
此前 source `0643969`、`658c241` 的镜像/运行只是旧阶段，不代表现在的应用修改。

阶段 draft PR 用于保存可继续的代码，不是部署批准或最终完成标记。

## 原创离线界面证据

实际浏览器完成登录、合成订单/诊断、工单批准提交、合成同意计划及撤回，
没有真实语音或模型调用。截图仅包含随机合成业务标识，不含账号/密钥。

![中文运营界面的合成工单提交与回访计划撤回结果](assets/synthetic-ops.png)

新增[架构源、SVG及PNG](architecture.md)、[场景咨询](scenario.md)、
[配置和关停手册](operations.md)、[能力证据矩阵](capabilities.md)。
`npm run record:demo` 已实际生成约21秒的私密合成UI视频草稿，只有video
stream，没有音频或供应商调用；录制绕过画面中的密码输入，但不是绕过认证。
文件仅在忽略的私密证据目录，没有同步GitHub，待单独公开审核。

本文由 GitHub Copilot 辅助编写，证据分层有意保留未验证项。
