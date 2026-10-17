# Voice Agent Lab · 企业级实时语音智能体售前方案、竞对分析与全栈实验室

[![GitHub Pages Presales Portal](https://img.shields.io/badge/GitHub%20Pages-H5%20Presales%20%26%20Sandbox%20Portal-2563EB?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/)
[![Azure Executive Slide Deck](https://img.shields.io/badge/Slide%20Deck-12--Slide%20Azure%20Briefing-0078D4?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/deck.html)
[![7-Card 4:5 Benchmark Report](https://img.shields.io/badge/Benchmark-7--Card%204%3A5%20Visual%20Deck-10B981?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/benchmark-cards.html)
[![Live Azure S2S Companion](https://img.shields.io/badge/Azure%20Voice%20Live-gpt--live--1%20Demo-8B5CF6?style=for-the-badge)](https://gpt-live-demo-0922-qc.azurewebsites.net/)

本仓库整合了**面向合作伙伴与政企/出海客户的实时语音智能体 (Voice Agent) 售前方案库、深度竞对打单卡、多引擎交互 H5 沙盒、12 页 Azure 高管演示幻灯片**，以及合成硬件品牌 **LumaNest** 的全栈参考实现（Retell AI + Azure AI Foundry + 双语坐席审批工作台）。

## 🌐 在线演示门户与核心售前资产 (Presales & Engineering Hub)

| 资产模块 | 在线访问 / 仓库路径 | 核心内容说明 |
|---|---|---|
| **H5 售前方案与多引擎交互总门户** | [**`https://turbo998.github.io/voice-agent-lab/`**](https://turbo998.github.io/voice-agent-lab/) (`site/index.html`) | 支持**简/繁/英三语完整切换**；涵盖 4 大高 ROI 场景、4 套参考架构蓝图、交互式选型决策器、竞对打单表、**Web Audio 多引擎实时语音沙盒（支持实时麦克风/自由提问诊断、分段时延瀑布、打断/噪音/安全越狱测试与中文坐席审批）** 及 **FinOps TCO 测算器** |
| **Azure 风格高管演示幻灯片 (12 Slides)** | [**`https://turbo998.github.io/voice-agent-lab/deck.html`**](https://turbo998.github.io/voice-agent-lab/deck.html) (`site/deck.html`) | 遵循 `azure-style-presentation` 规范：16:9 零依赖单文件 HTML 演示文稿，涵盖市场拐点、四大架构、Sierra/Retell/ElevenLabs 攻防卡、Speech 容器与 2 周 POC 路线图（支持键盘翻页与 PDF 打印） |
| **7-Card (4:5) 模型基准评测报告** | [**`https://turbo998.github.io/voice-agent-lab/benchmark-cards.html`**](https://turbo998.github.io/voice-agent-lab/benchmark-cards.html) (`site/benchmark-cards.html`) | 遵循 7-Card 4:5 竖版评测规范：基于 Azure East US 2 实测 (`gpt-4.1-mini` / `gpt-4.1` / `gpt-5.4-mini` / `gpt-live-1`) 与 6 大客服场景确定性护栏数据 (`site/data/voice-agent-benchmark-report.json`) |
| **售前实战打单手册与 POC 交付指南** | [`docs/presales-playbook.md`](docs/presales-playbook.md) | 首轮客户 5 维 Discovery 问卷、三大竞对设伏提问（Trap-Setting Questions）、15 分钟现场演示脚本与 2 周 POC 验收标准 |
| **业务场景与 ROI 白皮书** | [`docs/business-scenarios.md`](docs/business-scenarios.md) | 深度拆解智能硬件出海售后、快餐 Drive-Thru 点餐、金融车险报案 (FNOL)、医疗/IT 服务台 4 大场景痛点与 10 万通/月 TCO 收益模型 |
| **三范式方案架构设计指南** | [`docs/solution-architecture.md`](docs/solution-architecture.md) | 对比 **Paradigm A (Azure Voice Live `gpt-live-1` 原生 S2S)**、**Paradigm B (Constellation 级联多模型路由)** 与 **Paradigm C (Retell AI + Azure Foundry 混合云)** 架构与状态机设计 |
| **深度竞对分析与售前打单卡** | [`docs/competitive-analysis.md`](docs/competitive-analysis.md) | 全面剖析 **Sierra AI** ($10B Outcome 定价与 Constellation 架构)、**Retell AI**、**ElevenLabs (ElevenAgents)**、**Vapi / LiveKit** 的架构软肋、计费陷阱及微软 **Compete / Co-Sell** 话术 |
| **Azure Speech 本地容器部署指南** | [`docs/speech-container-guide.md`](docs/speech-container-guide.md) | 针对金融/政企内网“音频不出域”场景的 STT/TTS Docker 容器部署、防火墙白名单、计量心跳与性能评测手册 |
| **全域语音技术资产总目录** | [`docs/asset-catalog.md`](docs/asset-catalog.md) | 汇总 `turbo998/voice-agent-lab`、`turbo998/gpt-live-1-demo`、`turbo998/ai-gaming-lab` 与 Azure 实测环境资产 |

---

## 🧪 LumaNest 全栈语音工程实验室说明

中国智能硬件品牌出海东南亚的浏览器语音实验室。原创合成品牌 **LumaNest**，
覆盖售前咨询、订单查询、安全故障诊断、运营审批工单与同意后的回访计划。
不代表真实品牌政策，也不会拨号、发送短信、退款、支付或寄送商品。

**当前是部分基础设施部署、尚无云运行时，不是完整验收交付。** 真实语音关闭。
独立资源组已创建 Foundry/OpenAI 空账号、项目、Consumption 环境、Storage、
Key Vault 与日志。组织 modify Policy 将 Storage/Key Vault 公网访问关闭；
不重新启用，待确认合规私网拓扑与费用后继续应用部署。
Retell API 只读鉴权已验证；未创建真实通话或付费测试。实际
Foundry/Search 推理与 GPT Live 语音、供应商签名回调仍待验证。
详情见 [交付状态](docs/delivery-status.md) 与
[部署计划](.azure/deployment-plan.md)。
私网阻塞、最小候选和成本差异见 [网络决策依据](docs/network-decision.md)。
学习路径：[场景咨询与演练](docs/scenario.md) →
[架构与边界](docs/architecture.md) →
[私密配置/运行/关停恢复](docs/operations.md) →
[能力证据矩阵](docs/capabilities.md)。

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
npm run test:browser
npm run test:browser:live
```

详细知识条目见 [原创合成知识库](docs/knowledge.md)，价格事实与尚未完成的
计量映射见 [成本核验](docs/costs.md)。遵守组织每日停机政策，不绕过治理。

源代码与文档由 GitHub Copilot 辅助生成；公共产品/合规声明仍需人工审阅。
