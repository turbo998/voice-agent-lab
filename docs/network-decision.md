# 私网部署决策依据

2026-10-10，**候选方案，尚未批准/部署新的网络资源**。

## 已确认的阻塞

部分基础资源已经创建。Storage 与 Key Vault 的实时
`publicNetworkAccess=Disabled`。资源级 Activity Log 有成功的
`Microsoft.Authorization/policies/modify/action`：分别由
`StorageAccount_PublicNetwork_Modify` 和 `KeyVault_PublicNetwork_Modify`
对公网访问字段执行 AddOrReplace。这是已观察到的治理效果，不是推测。
完整管理组定义的可见性仍未解决；Policy state 当前没有条目，不等于合规。
保存的源码现已采用 Disabled，不反复提交 Enabled 与治理对抗。

现有 ACA 是 workload-profile 环境，仅配置 Consumption，未接自有 VNet，
无 private endpoint。[官方网络文档](https://learn.microsoft.com/azure/container-apps/networking)
说明创建后不能改变 network type，因此不能把现有环境就地接入 VNet。
当前不会删除/重建它，也不会创建替代环境，等待拓扑和预算决定。

## 最小候选

新外部 HTTPS workload-profile ACA 环境接专用、委派给
`Microsoft.App/environments` 的至少 /27 子网；独立非委派子网放 PE。
地址段必须在获准地址规划中选择，不猜测与企业路由是否冲突。
现有空环境保留；新环境也只选 Consumption，不新增 Dedicated 节点。

Storage Blob、Queue 各一个 PE，Key Vault 一个 PE，沿用 Entra MI/RBAC。
三个 private DNS zone 连接同一 VNet：
`privatelink.blob.core.windows.net`、`privatelink.queue.core.windows.net`、
`privatelink.vaultcore.azure.net`。应用仍使用正常服务 hostname，由 DNS
解析进私网，不更换为裸 IP。当前代码不使用 Tables；若增加 Table 存储，
需另加 table PE 和 `privatelink.table.core.windows.net`，不能复用 Blob PE。

外部浏览器与 Retell 签名回调继续经受保护的 HTTPS 入口；**不建 ACA 入站
PE**，不默认增加 NAT Gateway、Firewall、Private DNS Resolver、
VPN Gateway、Front Door 或 Dedicated profile。若组织另要求这些设施，
本候选必须重新核算和审批，不用“已经授权部署”替代重大变更决定。

Foundry 空账号目前公网 Enabled。Free Search 候选使用公网 Entra/RBAC，
不包含 Search PE。[Search PE 文档](https://learn.microsoft.com/azure/search/service-create-private-endpoint)
要求 Basic 以上；[最新 Foundry Search 工具文档](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/ai-search)
指出 basic agent 不支持私有 Search，需要 standard/VNet injection。
如果政策要求 Search 也私有，则 Free/basic 路线不满足条件；不能自动升 Basic，
也不能声称给应用 VNet 就等于给 Foundry 托管工具接通私有 Search。

## 部署机和配置入口

本地部署机尚无到候选 VNet 的已批准通路，不能直接写 Disabled 的 KV/Storage。
候选是 VNet 内一次性配置 job：使用明确、临时、资源范围的 MI 数据面写权，
通过加密的管理平面输入配置，禁止命令行、日志和公开参数文件携带密钥；
结束后删除 job 临时输入和回收额外写权。这里描述的是待实现路径，
不是已有的 secrets/bootstrap 验收。另一选项是用户明确指定已批准且
私网可达的部署主机；不扫描/借用无关环境或创建昂贵新 VPN/Resolver。

## 当前价格和成本差异

[官方 Retail API](https://prices.azure.com/api/retail/prices)，USD Consumption，
查询日期 2026-10-10；有界查询均无 NextPageLink。下面 Global/空区域标签
就是 API 的实际商业 meter 标签，**不是**借用边缘 Singapore 或 US Gov 价格。

| 产品 / meter | API区域 | USD | 单位 | 生效 |
|---|---|---:|---|---|
| Virtual Network Private Link / Standard Private Endpoint | Global | 0.01 | Hour | 2020-02-01 |
| Private Link / Standard Data Processed ingress、egress | Global | 0.01 | GB，首阶梯 | 2021-11-01 |
| Load Balancer / Standard Included LB Rules and Outbound Rules | Global | 0.025 | Hour | 2018-04-11 |
| Load Balancer / Standard Data Processed | Global | 0.005 | GB | 2018-04-11 |
| IP Addresses / Standard IPv4 Static Public IP | southeastasia | 0.005 | Hour | 2018-06-01 |
| Azure DNS / Private Zone | 空/商业Zone标签 | 0.50 | zone月费，首25项 | 2019-12-01 |
| Azure DNS / Private Queries | 空/商业Zone标签 | 0.40 | 1M | 2019-12-01 |
| ACA / Dedicated Plan Management | southeastasia | 0.10 | Hour | 2023-08-01 |
| ACA / Environment Management Hour | southeastasia | 0.14 | Hour | 2026-09-01 |

[ACA VNet 托管资源文档](https://learn.microsoft.com/azure/container-apps/custom-virtual-networks)
列出外部 workload-profile 环境的1个 Standard LB、1个 ingress IP、
1个 egress IP，不能只算三个数据 PE。730小时候选固定网络约
`3×7.30 + 18.25 + 2×3.65 + 3×0.50 = USD48.95/月`，另有流量/DNS查询。
Table 如启用另加约 USD7.80/月。固定费用不会随应用 scale-to-zero 消失。

[官方 ACA pricing](https://azure.microsoft.com/pricing/details/container-apps/)
明确 management meter 用于 Dedicated、ACA private endpoint 和 planned
maintenance，多个功能收费可叠加。现有环境没有这些特性；候选亦不使用。
如果增加 ACA 入站 PE，除 PE 本身还需核对实际管理 meter 映射（目录分别为
每月 USD73 / USD102.20），不能仅算 USD7.30。这会超出推荐 POC 包络。

保留两个 app 和一个 job 各0.25CPU/0.5Gi **全月持续活跃**、USD30模型预算，
加日志9.27、存储2、KV0.30和网络48.95后约 **USD173.31/月，未留余量**。
因此先前的公共端点运行估算不能沿用到私网方案。

一个可讨论的 **受限 POC 用量档** 是每app100活跃小时/月、job总30小时/月：
compute约8.69 + 固定网络48.95 + 模型预算30 + 日志9.27 +
存储/KV2.30 + 余量20 = **USD119.21/月**，不计免费额度。
此档必须落实运行窗口、暂停/恢复、日常监控和使用边界；不是任意恶意流量的
账单硬cap。模型门禁仍单独关闭，未经费率/协议核验不消费该预算。
治理强制的其他付费资源、 bootstrap 和实际 meter 需继续核对。

需要决定的是受限运行档/私网新环境是否接受，以及是否有已批准的企业
部署机/私网通路或更严格的 Search/入口私有化要求。未决定前只做离线资产、
只读核验和缺失 Search 的窄范围预检，不创建新的网络资源。
