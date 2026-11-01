# Security and privacy

## Included

- Portable source code and tests
- Placeholder-only infrastructure examples
- Official public control response evidence
- Aggregated customer-derived metrics with neutral file labels

## Excluded

- All audio
- Customer transcript text
- Customer source filenames
- User identities and local paths
- Live tenant, subscription, principal, resource-group, and account identifiers
- Credentials, session material, request headers, and environment values

## Operational requirements

1. Store customer audio only in an owner-approved location.
2. Use least-privilege, resource-scoped `Cognitive Services Speech User`.
3. Prefer `DefaultAzureCredential`; do not place secrets in source, command history, reports, or tickets.
4. Keep SDK diagnostic logging at warning level or higher.
5. Review generated raw responses before sharing because transcription text can contain personal or confidential content.
6. Do not destroy Azure resources unless the owner explicitly approves teardown.
