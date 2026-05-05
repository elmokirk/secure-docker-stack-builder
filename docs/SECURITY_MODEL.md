# Security Model

The builder is secure-by-default:

- no backend in the MVP
- no real secrets persisted
- no localStorage persistence for generated secrets
- `.env.example` only contains placeholders
- production exports use policy gates
- generated `risk-report.json` is machine-readable for agents

## Recommended Agent Rule

- `riskLevel=low`: can proceed with normal automation.
- `riskLevel=medium`: ask for explicit approval.
- `riskLevel=blocked`: do not deploy.

## Policy Examples

Block production exports when:

- a database has a host port
- an internal bridge/webhook receiver has a host port
- an LLM gateway is public
- an admin dashboard lacks auth-capable ingress
- a local-only module is selected for a production target
