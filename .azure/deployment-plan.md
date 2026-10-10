# Voice Agent Lab deployment plan

Status: Validated (foundation only)

## Authorization and scope

The user explicitly authorized autonomous implementation and Azure deployment.
This plan implements the approved browser-only, synthetic smart-hardware export
scenario. It is not another planning approval request.

## Confirmed constraints

- Work only in this isolated worktree; preserve the original GPT Live repository.
- Publish sanitized source and technical assets. Keep secrets and cloud account
  identifiers in ignored private runtime configuration.
- Use the selected Azure subscription explicitly and a new isolated resource group.
- New Azure spending below USD 150/month; no paid Retell overage, recharge,
  payment method, telephone purchases, dialing, or SMS.
- Respect organization shutdown and authentication policy.
- English browser voice, Chinese operations UI, original synthetic business data.
- Independent Retell-native and GPT Live experiments; never substitute protocols.
- Side effects require authenticated operator approval, versions, and idempotency.
- Verify raw-body Retell signatures using the designated webhook signing key.

## Architecture to validate

Consumption Container Apps, private Azure Storage, managed identity, Key Vault,
bounded telemetry, Foundry reasoning in Southeast Asia, GPT Live in South India,
and Azure AI Search Free where policy/capacity permit. No silent paid SKU upgrade.

## Execution and verification

1. Inspect approved context, public baseline, and current SDK contracts.
2. Implement business tools, operator authentication, durable caps/events, and UI.
3. Import public MIT GPT Live source with provenance and safe cloud configuration.
4. Implement native Retell configuration and Foundry reasoning/grounding.
5. Generate infrastructure, recovery scripts, documentation, and sanitized assets.
6. Validate local functionality and authorization/cost boundaries.
7. Mark Ready for Validation; invoke azure-validate, then azure-deploy.
8. Verify live integrations, record evidence/blockers, commit, push, and open PR.

## Cost and capability gates

Retell: at most 15 voice minutes, 3 minutes/call, USD 5 voice reservation,
USD 2 text-testing reservation, and USD 3 untouched trial reserve.
Azure: durable application-side reservations and budget alerts; alerts are not
hard caps. Verify model protocol, capacity, policy, and prices before spending.
Synthetic UI recording is not proof of live microphone operation.

## Progress and evidence

Initial skeleton created before application or infrastructure generation.
Final resource mapping, SDK contracts, verification evidence, and deployment
status will be recorded progressively.

## Predeployment evidence (2026-10-10)

- Selected subscription read operations use an explicit subscription argument;
  account identifiers are not committed here.
- Container Apps Southeast Asia: ManagedEnvironmentCount limit 50, used 2.
  The planned one environment fits this quota. This is not proof of runtime
  capacity, region admission, or policy compliance.
- Microsoft.Search remains NotRegistered; visible Search service count is zero.
  Registration is a subscription-level mutation, not an isolated resource-group
  operation. It has not been performed and must be recorded separately during
  the validated deployment workflow.
- The subscription deny-assignment read returned six visible, system-protected
  assignments at existing resource-group/resource scopes. They restrict delete,
  move and lock operations, not a subscription-wide create grant. No subscription-
  scoped assignment appeared in this response. This does not establish absence
  of inherited denies or policy, or permission on the future target scope.
  Role Actions `*` with no NotActions is not evidence that denies are absent.
- Management-group inherited policy visibility remains unresolved after the
  earlier denied read. Do not bypass or modify policy/network requirements.
  Authorized ARM validation/what-if and actual resource/data-plane operations
  must establish what is permitted.
- Root typecheck, 56 offline tests and staged production build passed after
  Foundry identity/citation/uncertainty hardening. The independent GPT Live
  baseline passed 33 tests and its release scan. No live Foundry invocation was
  performed; these checks are not live voice acceptance.
- Retell scoped agent-list authentication succeeded without creating a call or
  paid test. Trial/payment/recharge/full-rate evidence and supplier-signed webhook
  verification remain pending; real-call gates stay disabled.
- Retail pricing MCP returned no matching reasoning rows and a parser error
  for the Live service-family value. Pricing verification remains incomplete;
  these failures do not authorize estimated meter values or deployment spending.
- At this original preflight checkpoint no Azure resources, provider registrations,
  model invocations or Retell calls had been created. The subsequent stage was
  committed and pushed as c33f507 with an open draft delivery PR; it is not deployed.

## Current official retail observations

The bounded official Retail Prices API query succeeded on 2026-10-10:
South India Azure OpenAI Media `Live 1 Gl Unit`, `1 Hour`, USD 3.00,
effective 2026-09-01; Southeast Asia GPT5 mini DataZone input/output/cached input
USD 0.90/5.40/0.09 per 1M, effective 2026-06-01.
See `docs/costs.md` for exact SKU and meter identifiers.
These observations supersede the failed MCP lookup, but do not prove a mapping
to an actual model deployment or authorize a different GlobalStandard rate.
Live control/expiry and full selected model/voice costs remain closed gates.

## Prepared deployment recipe and stage boundary

Standalone Bicep + Azure CLI selected because a verified Bicep compiler and Azure
CLI are installed, while Docker/azd are not. GitHub Actions can build the public
container without credentials or deploying Azure. Module selection followed AVM
pattern -> resource -> utility: use basic Foundry pattern 0.7.0; do not use the
larger ACA landing-zone pattern because it introduces infrastructure outside this
bounded lab. Resource modules provide the small Consumption environment.

`infra/main.bicep` creates a uniquely suffixed **new** `rg-voice-lab-*` group.
First stage has `deployApps=false`: no replicas or model deployments, inference,
hosted agents or telephone capability. Second stage requires a digest-pinned,
anonymously pullable GHCR image, securely provisioned Key Vault secrets and
discovered provider endpoints. No existing resource or global default is changed.

| Component | SKU / configuration |
|---|---|
| SEA Container Apps environment | Consumption profile only; no Dedicated, planned maintenance or environment private endpoint |
| Retell / GPT Live apps (second stage) | 0.25 CPU / 0.5Gi each; min 0 / max 1; HTTPS; readiness/liveness/startup probes |
| Post-call job (second stage) | 0.25 CPU / 0.5Gi; one execution; 60s timeout; no automatic replica retries |
| State / queue | Standard_LRS; private blob container; no Shared Key / public blobs; TLS 1.2 |
| Secrets | Key Vault Standard, RBAC, soft delete and purge protection; no template secret values |
| Logs | PerGB2018, 30-day retention, 0.1GB daily ingestion quota |
| Foundry | SEA S0 account + basic project, MI, no model/capability-host/associated-resource defaults |
| GPT Live | Independent South India S0 OpenAI account, Entra-only, no model deployment yet |
| Search | Free, one index planned, simple queries, Entra-only; never auto-upgrade |

Shared runtime MI is limited to this lab's blob/queue data, vault reads, Search
query and Foundry/inference access. Foundry account MI gets the documented Search
tool roles. The builtin role formerly named Azure AI User is currently named
**Foundry User**, verified from the selected subscription's role definitions.
Bootstrap data-plane role grants for the configuring operator have not been made.
Public network endpoints are authenticated; private **data access** is not a claim
of private-network isolation. Mandatory inherited network policy must be respected.
What-if exposed AVM Storage's implicit Deny ACL, incompatible with this prepared
public-endpoint/MI design. The **new, unprovisioned** storage account now explicitly
uses Allow with no trusted-service bypass, while shared keys and public blobs are
disabled. This changes no existing network resource/policy; rerun provider-level
admission. If organizational policy denies it, stop rather than deploy/bypass.

Pinned AVM modules: identity 0.6.0; workspace 0.16.1; storage 0.33.1;
vault 0.14.2; environment 0.16.0; Foundry pattern 0.7.0; Search 0.13.0;
OpenAI account 0.19.1; container app 0.23.0; job 0.7.2.
Official sources: `https://github.com/Azure/bicep-registry-modules`.

## Provisioning inventory and admission checks

Actual selected-subscription reads use explicit subscription arguments; identifiers
and eventual deployment outputs stay private. Limits source:
`https://learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits`.

| Resource | First-stage count | Observed usage / resulting usage | Admission evidence |
|---|---|---|---|
| Resource group | 1 | 21 -> 22 subscription groups | Documented limit 980 |
| Managed environment | 1 | SEA 2 -> 3 | CLI ManagedEnvironmentCount limit 50 |
| Storage account | 1 | SEA 4 -> 5 | CLI StorageAccounts limit 250; refreshed observation |
| Key Vault | 1 | Subscription 3 -> 4 | Quota CLI BadRequest; vault API admission must be validated; do not apply the unrelated Backup-vault limit |
| AI account | 2 (one each SEA/SI) | SEA 0 -> 1; SI 0 -> 1 | CLI quota BadRequest; visible seven accounts elsewhere; docs 100/type and 200 mixed per region |
| Search Free | 1 | Visible subscription services 0 -> 1 | Documented one Free/subscription; quota endpoint requires provider registration |
| MI | 1 | One runtime identity in new group | Documented 80 creations/20s/subscription/region; tenant object admission must be validated |
| Workspace | 1 | One workspace in new group | ARM per-resource-type/RG bound; provider admission must be validated |
| Foundry project / connection / scoped IAM | 1 / 1 / 9 | New group resources only | ARM template/provider/RBAC validation required |
| Apps / jobs / model deployments | 0 / 0 / 0 | None first stage | Environment Consumption-core quota only observable after environment creation; second-stage deployment remains gated |

No quota increase or subscription provider registration was performed. Search
quota discovery returned provider-not-registered, not proof of no quota. The first
stage's ARM validation and what-if must confirm region/API/policy/IAM admission;
only azure-deploy may perform an approved needed registration as a separately
recorded subscription mutation. Unknown inherited policies remain unknown.

## Functional verification and current validation inputs

Main 57 offline tests and typecheck pass. Production build and independent GPT
Live baseline 33 tests/release scan pass. Actual browser synthetic workflow
passes login, tools, approval/commit, plan and withdrawal; no human audio or
model/provider invocation. Reviewed screenshot is `docs/assets/synthetic-ops.png`.
All task-owned browser/server helpers are stopped.

`az bicep build --file infra/main.bicep` succeeds using compiler 0.42.1.
Known warning BCP081: pinned vault module uses API 2026-02-01, absent from this
compiler's type cache. Do not silence it or assume acceptance; ARM validation is
required. All outputs compile into ignored `.azure/compiled-main.json`.
Digest/secret/provider roots remain mandatory before the app stage; native model/
voice integration is intentionally disabled pending independent validation.

## Cost envelope for the prepared first stage

The first stage allocates no running apps/jobs/models, so it creates no app,
voice or inference compute usage. It retains bounded logs/storage/KV, not a
promise that governance adds no charges. No Dedicated/PE/planned maintenance
features are enabled.

Current SEA Consumption retail active CPU USD 0.000034/CPU-second and memory
USD 0.000004/GiB-second imply about USD 55.19/month for both app replicas running
continuously, before free grants; worker worst-case continuous additional replica
about USD 27.59/month. Add USD 30 model/Live reserved budget and a USD 25
storage/logs/requests/contingency envelope: USD 137.78 conservative prepared
operating estimate. This estimate requires remaining service meter/policy checks,
and is not an invoice-hard cap.
Official ACA billing says Consumption-only environments have no Dedicated plan
management fee unless chargeable features such as private endpoints/planned
maintenance are used. If policy requires those features or higher SKUs, stop and
revise rather than exceed USD 150 or bypass policy.

## Validation proof

azure-validate executed. This status authorizes only the prepared empty-compute
foundation stage. Apps, models and live calls require their separate validation.

### All validation checks pass

- [x] Authentication: explicit selected subscription Enabled/AzureCloud.
- [x] Bicep Compilation: compiler succeeds; known vault schema warning remains.
- [x] Template Validation: subscription-scope explicit Provider validation succeeded.
- [x] What-If Preview: 25 Create, zero Unsupported/Modify/Delete, all in new lab group.
- [x] Build Verification: staged application build, 57 + 33 tests, browser and six
  offline evaluation cases pass, no model/human voice evidence claimed.
- [x] Static Role Verification: shared runtime MI has blob/queue read-write,
  vault-secret read, Search query, Foundry project use and both inference-account
  use; Foundry account MI has Search tool data/service access. All service-scoped,
  no Owner/Contributor subscription grants. Local configuration data-plane access
  is a separately pending bootstrap/postdeployment check, not inferred from CLI login.
- [x] Azure Policy Validation: subscription MCP returned inherited assignments too,
  but without rule/parameter serialization; previously denied management-group
  definitions remain unknown. Explicit Provider-level ARM validation/what-if accepted
  the first-stage template without policy denials. This is admission evidence only,
  not a claim of full inherited-policy visibility or eventual runtime compliance.
- [x] Container Verification: not required for no-app/no-job foundation; remote
  image build remains a mandatory separate second-stage gate.

`infra/main.parameters.json` contains only public environment/location/stage
values. Actual subscription and outputs remain outside tracked parameters.

Final commands:
`az deployment sub validate --validation-level Provider` and
`az deployment sub what-if --validation-level Provider --no-pretty-print`,
with explicit selected subscription, SEA location, `infra/main.bicep` and
`infra/main.parameters.json`; both Succeeded. Raw private proof is in ignored
`.azure/arm-validation.json` and `.azure/arm-whatif.json`.
Eight initial unidentifiable AVM role names were corrected with deterministic
names; final preview resolves all 25 resource IDs. Existing lab group count is zero.
Standard Vault API 2026-02-01 was accepted by provider validation despite the
compiler type-cache warning. Search provider remains NotRegistered; registration
is a separately logged subscription mutation during azure-deploy, not quota proof.
