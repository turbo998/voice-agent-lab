# Voice Agent Lab

中国智能硬件品牌出海东南亚的浏览器语音实验室。原创合成品牌 **LumaNest**，
覆盖售前咨询、订单查询、安全故障诊断、运营审批工单与同意后的回访计划。
不代表真实品牌政策，也不会拨号、发送短信、退款、支付或寄送商品。

**当前是未部署的阶段实现，不是生产服务或完整验收交付。** 真实语音默认关闭。
Retell API 只读鉴权已验证；未创建真实通话或付费测试。Azure 部署、实际
Foundry/Search 推理与 GPT Live 语音、供应商签名回调仍待验证。
详情见 [交付状态](docs/delivery-status.md) 与
[部署计划](.azure/deployment-plan.md)。

## 两个独立实验

| 实验 | 实现 | 当前证据 |
|---|---|---|
| Retell-native | Conversation Flow、严格业务函数、可选只读 MCP、字幕与主管控制 | 离线测试、构建；原生配置尚未发布到服务 |
| GPT Live | 保留 MIT 上游独立 UI 和 `/live/sessions` 协议，增加受保护云适配器 | 原始 33 项测试与发布扫描；无真实语音证明 |
| Foundry | 固定版本 Prompt Agent + Responses + Azure AI Search 简单查询 | 代码完成基础路径；云兼容性/权限待实测 |

GPT Live **不是** Retell Web SDK、Azure Voice Live 或 Realtime 协议。
导入来源、固定提交和许可证见
[GPT Live provenance](experiments/gpt-live/PROVENANCE.json)。
上游界面图片仅是导入的原始 UI 资产，不是本实验的 live 验收截图。

## 本地离线业务演练

需要 Node.js 22+、npm。所有命令在本仓库工作目录执行。

```powershell
npm ci --no-audit --no-fund
npm run setup:local
npm run build
npm run dev
```

打开 `http://127.0.0.1:8080`。私下查看 `.private\operator.password.txt`
并登录；不要将该文件、`.private\lab.env` 或浏览器 cookie 上传到 GitHub。
首次配置不会覆盖既有配置，无默认密码。

选择新加坡合成客户和 Cam Air，运行合成业务演练：查询订单 `LN-SG-1001`，
诊断 5 GHz 配网失败，审阅草稿后批准固定版本，再提交工单。录入回访同意
必须来自明确用户表达并由运营员确认；生成的仅是计划，不发生外部联系。
本地无 Foundry 配置时使用标注为确定性 fixture 的诊断，不伪装成模型输出。

独立 GPT Live 的原始本地使用说明见
[中文指南](experiments/gpt-live/README.zh-CN.md)；
开发时必须显式设置仓库内忽略的私有数据目录，不能复用安装应用的数据。
云入口是 `npm run start:gpt-live`，但需已完成安全运行时配置与权限核验，
不是零配置启用真实语音的命令。

## 边界与验证

- 服务端凭据、运营员 cookie、CSRF、会话所属权与固定 provider 配置。
- 签名校验针对原始字节和时间戳，使用独立指定的 Retell webhook signer。
- 工单写入需要运营审批版本和幂等键；模型自称批准或同意无效。
- 持久化预算预留、未知请求不释放并发、暂停与过期门禁。
- Retell 试用声额度上限 USD 5 / 15 分钟，每次最多 3 分钟；文本预留
  USD 2，保留 USD 3。不充值、不添加卡、不购买电话号码。
- Azure 新增费用目标不超过 USD 150/月。告警不是硬限额，应用预算也不能
  保证任意客户端行为的账单上限；未验证用途继续关闭。

```powershell
npm run typecheck
npm test
npm run build
npm run test:gpt-live
npm run check:gpt-live
npm run check:public
```

详细知识条目见 [原创合成知识库](docs/knowledge.md)，价格事实与尚未完成的
计量映射见 [成本核验](docs/costs.md)。遵守组织每日停机政策，不绕过治理。

源代码与文档由 GitHub Copilot 辅助生成；公共产品/合规声明仍需人工审阅。
