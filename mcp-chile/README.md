# frontiera-mcp-chile (prototype, not published)

MCP server that gives Claude or ChatGPT two Chilean abilities:

| Tool | What it does | Needs |
|---|---|---|
| `buscar_licitaciones` | Active Mercado Publico tenders matching keywords, soonest closing first | `MERCADOPUBLICO_TICKET` |
| `detalle_licitacion` | Buyer, region, estimated amount, key dates and items of one tender | `MERCADOPUBLICO_TICKET` |
| `validar_rut` | RUT check digit (modulo 11) and formatting | nothing |
| `boleta_honorarios` | Gross, retention and net of a boleta de honorarios (13.75% 2024 to 17% 2028) | nothing |
| `calcular_iva` | Adds or splits Chilean VAT 19% | nothing |

## Run locally
```
npm install
npm test
MERCADOPUBLICO_TICKET=... node src/server.js   # stdio transport
```

## Connect to Claude Desktop
Add to `claude_desktop_config.json`:
```json
{ "mcpServers": { "frontiera-chile": { "command": "node", "args": ["/path/to/mcp-chile/src/server.js"], "env": { "MERCADOPUBLICO_TICKET": "..." } } } }
```

## Status
- Calculations: tested.
- Mercado Publico: tested only against fixtures. The sandbox where this was built cannot reach api.mercadopublico.cl, and the field names follow the public API docs. Confirm with a live ticket.
- Not yet: remote HTTP endpoint (needed for claude.ai and ChatGPT), billing, directory listing.
