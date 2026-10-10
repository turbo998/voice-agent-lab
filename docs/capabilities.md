# 能力与证据矩阵

2026-10-10。本表按“实现 → 离线 → 实际服务 → 真人”分层，
不把SDK类型、生成模板或供应商目录当端到端兼容性证明。
所有真实语音/推理开关仍关闭；没有本次真人录音或电话活动。

| 能力 | 实现与本次证据 | 真实服务/真人状态 |
|---|---|---|
| Retell Conversation Flow | flow生成器与图路由测试，保留原生引擎 | 未创建/发布本次agent |
| 原生函数/提取/逻辑/全局/子流程 | 显式节点/严格工具契约与离线路径 | 全组件的服务配置兼容性未验证 |
| Custom functions | 原始签名+时间戳+call绑定；默认无危险重试 | 指定signer真实回调未验证 |
| 可选MCP | 会话grant、只读工具、HTTP入口测试 | 未配置供应商MCP连接 |
| Web SDK v3 | 服务端REST/信令broker；无浏览器API key | SDK实际web-call transport未验证 |
| 字幕 | 受限转发，丢弃工具凭据/metadata；降级提示 | 未有真实字幕连接 |
| 主管监听/接管 | call所属权；不可逆停止AI，不确定状态阻止重试 | 未有真实接管；不宣称能恢复AI |
| 试用/成本 | 原子USD5/15min预留、3min单次、未知不释放 | 新余额/完整费率未验证，不启用 |
| 生命周期/webhook恢复 | 持久化accept-before-ACK、去重/毒事件、授权History对账 | 真实shutdown/retry链路未验证 |
| Foundry Prompt Agent/Responses | MI、JSON schema、不可变引用校验 | 空账号/项目已部署，模型/agent尚无 |
| AI Search grounding | 原创K01–K12、simple query配置、CognitiveSearch/AAD IaC | Free服务未创建，原生工具路径未验证 |
| GPT Live独立导入 | MIT固定基线48文件，原始33测试/扫描通过 | 没有真实Azure Live会话 |
| GPT Live云UI | 实际浏览器中英切换、独立语音语言、草稿保留、门禁关闭 | 无人声/供应商调用 |
| GPT Live工具/审批关联 | 同严格业务工具；创建响应业务ID到运营链接，按owner恢复 | 跨云应用/真实provider待验收 |
| GPT Live正常关停 | 模拟attach/close最终用量与延迟持久化等待回归通过 | 真实MI/expiry/孤儿恢复/直接浏览器费用边界未验证 |
| 运营业务 | 实际浏览器查单、诊断、审批、幂等提交、合成同意/撤回 | 仅原创合成系统，无真实CRM/退款 |
| 云基础 | 实际独立RG基础创建，组织公网modify效果确认 | 部分失败，无应用运行时；私网方案待决定 |
| 镜像发布 | 实际Actions build/push与匿名manifest200，固定source/digest | 不是ACA容器启动/数据面证明 |
| 演示媒体 | 原创合成UI截图、架构Mermaid/SVG/PNG；约21秒实际UI私密视频草稿 | 仅video stream，无音频/供应商调用；视频未公开，待审核 |
| 电话/SIP/SMS | 禁用契约/边界说明 | 不采购、不拨号、不发短信 |
| Contact memory | 本应用的合成状态可持久化 | 不宣称Retell browser原生自动保存联系人记忆 |

复现命令见[README验证](../README.md#边界与验证)。
`npm run evidence`是六个合成业务用例；`npm run test:browser:live`
是实际浏览器操作模拟云配置，不能改名为真实Live验收。
服务验收需独立保存时间、固定版本、输入范围、实际结果与费用，
公开前去除凭据、私有标识、真实用户内容和未经同意的人声。

本文由 GitHub Copilot 辅助编写；未验证栏是发布门禁，而非功能保证。
