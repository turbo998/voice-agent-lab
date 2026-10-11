# 私密配置、运行与关停恢复

## 用途

单运营员 POC 的安装、配置和失效排查。当前没有云应用地址；本地演练
可以运行，云端数据面和供应商链路仍未验收。不适用于生产多用户部署。

## 前提和配置边界

只操作隔离工作目录，Azure 命令显式选择已确认订阅；不切全局默认。
任何配置入口都不得打印完整环境、密钥、cookie、签名、访问令牌或私有资源ID。
公共仓库不存 `.env`、DPAPI 文件、原始账户页面或云部署原始输出。

| 配置域 | 字段/契约 | 保存与用途 |
|---|---|---|
| 运营认证 | `APP_ORIGIN`, `OPERATOR_PASSWORD_HASH`, `TOKEN_SECRET` | 私密运行时；哈希不是默认密码，token secret不得由模型获得 |
| Azure 数据面 | `LAB_MODE`, `AZURE_CLIENT_ID`, `AZURE_STORAGE_BLOB_ENDPOINT`, `AZURE_STORAGE_QUEUE_ENDPOINT` | 固定配置 + MI；不是共享账号密钥 |
| Retell API | `RETELL_API_KEY` | 服务端配置/REST，仅 scoped key；不能返回浏览器 |
| Retell signer | `RETELL_WEBHOOK_SIGNING_KEY` | 独立指定 signer；不是自动拿 API key 替代 |
| Retell 固定版本 | `RETELL_AGENT_ID`, `RETELL_AGENT_VERSION` | 私密配置 journal核对后的明确版本，不使用“最新” |
| Foundry | `FOUNDRY_PROJECT_ENDPOINT`, `FOUNDRY_AGENT_NAME`, `FOUNDRY_AGENT_VERSION`, `FOUNDRY_MODEL_DEPLOYMENT`, `KNOWLEDGE_COMMIT` | 明确版本/来源；配置脚本另需 `AI_SEARCH_CONNECTION_ID` |
| GPT Live | `LIVE_PROVIDER_ENDPOINT`, `LIVE_REASONING_ENDPOINT`, `LIVE_MODEL_DEPLOYMENT`, `OPERATOR_APP_URL` | immutable provider配置；非密钥偏好持久化到Blob |

本地可用操作员限定的受保护输入与 DPAPI 解密，将两个 Retell字段仅设置在
当前 PowerShell进程，然后由其启动的Node进程继承。不得把值拼接到 argv，
写入明文.env，或输出解密内容。云端候选是Key Vault secret reference，
由MI读取；尚未完成私网bootstrap，不能声称密钥已经注入Azure。

Storage/KV实际公网Disabled，不能为了初始化而开启。普通电脑尚无
获准的直连私网路径；已批准的VNet内有限job完成第一次DNS/MI
Blob/Queue与KV metadata验证。首次加密commit管理面网络重置，
确定部署名两次DeploymentNotFound，未启动commit；临时job/3授权/MI
真实清理计数均0。不能因此声称secret已写入；用新binding恢复，不延长旧TTL。
Bootstrap临时写权必须限定资源、独立于常规读取身份，并在完成后回收。

## 受限运行窗口

仅已批准的每app100h/月、worker总30h/月、模型30USD边界。服务端Blob CAS
预留完整activation窗口及16min关停余量；最长单窗口3h，不能跨月或重叠，
退出不退款。缺失/过期/损坏控制文件不允许新runtime启动，已运行服务
15s检查后关闭服务；这只是补充，不能阻止平台重启费用。

独立controller设计仅拥有两app的revision read/deactivate动作与私密控制
Blob读取，不能activate、start任意job、listSecrets或修改app。每10min、
timeout15s/retry0；postcall每小时timeout30s/retry0，31日最坏24.8h，
另计有限bootstrap，保留worker30h余量。尚未声称controller实际部署/停用
验收完成。调度失败需立即人工停用revision；运行小时不是恶意流量账单硬cap。
关闭app不消除PE/LB/IP/DNS固定费用。

RSA3072-OAEP/SHA256 + AES256-GCM一次性密文绑定UUID和15minTTL。
私钥只在private Blob，临时写权/输入按目的回收。Storage7日soft-delete
保留可恢复残余，删除不是物理清除/cryptographic shredding；不关闭治理
保留或purge protection。Operator密码仅DPAPI CurrentUser私密文件，
hash/token在进程内生成；不经命令行或日志传入。

## 本地无供应商演练

1. 按[README安装步骤](../README.md#本地离线业务演练)生成本地私密配置、
   构建并启动；不要覆盖旧配置。
2. 登录后选择合成客户，运行[场景](scenario.md)。检查诊断mode与来源、
   审批版本、`planned_not_dialed`和撤回结果。
3. 正常结束本任务启动的服务器；不要按进程名批量结束其他用户服务。
   私密状态文件保留，依赖与公开源码不含凭据。

## 云/供应商启用顺序：未完成的门禁

1. 用户接受私网拓扑与用量档后，更新实际状态下的部署计划，依次prepare、
   validate、deploy。不能将历史空资源what-if当成当前重放许可。
2. 先确认private DNS、MI、Blob CAS/Queue/KV数据面、版本镜像和未启用
   语音的功能端点；仅health200不算审批/预算/持久化成功。
3. Retell原生配置脚本 `npm run configure:retell` 会创建/发布配置，
   **不是只读检查**；必须有真实HTTPS回调地址、选定语音/组件兼容性
   和私密journal。该脚本不启动通话，配置成功也不解除费用门禁。
4. Foundry需创建正确SKU/model/auth deployment、原始知识index和AAD连接，
   才执行 `npm run seed:search` / `npm run configure:foundry`。这两者
   修改供应商数据/配置；是否支持Free/simple路径仍需实际证明。
5. 最后核对Retell近期试用余额、无付款/无自动充值、完整所选费率与指定
   signer回调；核对GPT Live实际协议/MI、provider expiry、关闭回执和
   浏览器直接通路的成本边界。没有证据不得设置启用开关。

Retell门禁还要求 `RETELL_TRIAL_VERIFIED_AT` 为不超过1小时且非未来的真实
观察、balance300–1000cents和 `RETELL_NO_PAYMENT_NO_RECHARGE=true`。
Live门禁需 `LIVE_RATE_CENTS_PER_MINUTE`, `LIVE_PROVIDER_MAX_SECONDS`,
`LIVE_CONTROL_VERIFIED_AT`。历史目录费率/格式校验不能代替真实供应商验证。
默认 `REMOTE_CALLS_ENABLED=false`、`LIVE_CALLS_ENABLED=false`。

## 每日组织关停与恢复

遵守组织关停，不禁用调度或保护策略。关停前暂停新付费请求，正常关闭
任务自己的应用；GPT Live正常退出先发送关闭事件，并等待有最终用量的
供应商回执及持久化结算，失败明确报未确认，预留保持。

恢复后先检查实际资源、private DNS/身份和版本，再登录运营页。Retell
“关停后对账”仅查询当前运营员已关联通话，确认终态后进入持久化inbox，
按event+call幂等消费。没有API/agent配置时该动作会报错，不能伪造恢复成功。
毒事件需查明原因后受控修复，不无限重试或自动删除账本。

**GPT Live恢复代码已做本地模拟，真实协议恢复尚未验收。** 启动时仅对
账本中关联有效的已知provider ID有界attach/close，不恢复语音、模型或业务
写权限；必须收到最终用量，且符合该call创建时保存的费率/expiry范围才能
结算。旧记录缺这些事实、未知ID、断网创建不确定、缺最终用量时继续保留
并发/费用预留。无效关联的日志明确报错，即使reservation误标终态也不开放
新通话。必须保持新Live门禁关闭，按真实provider协议验证最终用量后人工
核对，不据本地计时猜退款，也不枚举/猜测供应商ID。
关闭浏览器不能保证供应商停止计费。

## 排障

| 现象 | 当前可执行动作 |
|---|---|
| 登录失败/限流 | 确認固定origin、正确私密密码；一分钟限流不改权限绕过 |
| 审批链接无权/不存在 | 重新登录正确运营员；URL只定位，不授予身份或客户权限 |
| 云Data Plane拒绝 | 查private DNS、路径、MI/RBAC；保留Disabled，不开启公网 |
| 字幕不可用但音频工作 | UI明确展示字幕降级；不能声称字幕服务通过 |
| 主管接管超时 | 标记不确定、阻止再接管/注入；不能“恢复AI”掩盖不可逆状态 |
| 模型/费用门禁过期 | 保持禁用，重新取得真实协议/余额/费率证据，不只刷新时间戳 |
| Cost查询0行 | 新账单可能延迟；不是零费用证明，预算告警也不是硬cap |

本文由 GitHub Copilot 辅助编写；安全与业务责任人需审阅真实部署配置。
