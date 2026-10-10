# Voice Agent Lab deployment plan

Status: Preparing implementation

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
- No Azure resources, provider registrations, model invocations, Retell calls,
  implementation commits, pushes, or delivery PR have been created.

## Current official retail observations

The bounded official Retail Prices API query succeeded on 2026-10-10:
South India Azure OpenAI Media `Live 1 Gl Unit`, `1 Hour`, USD 3.00,
effective 2026-09-01; Southeast Asia GPT5 mini DataZone input/output/cached input
USD 0.90/5.40/0.09 per 1M, effective 2026-06-01.
See `docs/costs.md` for exact SKU and meter identifiers.
These observations supersede the failed MCP lookup, but do not prove a mapping
to an actual model deployment or authorize a different GlobalStandard rate.
Live control/expiry and full selected model/voice costs remain closed gates.
