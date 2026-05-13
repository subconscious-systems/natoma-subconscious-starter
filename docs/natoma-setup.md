# Setting up Natoma MCPs

[Natoma](https://natoma.ai) is a managed MCP gateway. Instead of running an MCP server yourself for each integration (Gmail, Linear, GitHub, ...), you log in once at natoma.ai, connect each service, and Natoma gives you back an MCP **URL** and an **API key** per connection.

Your agent then talks to those URLs over MCP's Streamable HTTP transport — no local servers, no OAuth flows in your code.

## 1. Connect an integration

1. Sign in at [natoma.ai](https://natoma.ai).
2. Browse the integration catalog (Gmail, Linear, GitHub, Notion, Slack, Brave Search, AWS, Resend, Context7, and more).
3. Click **Connect** on the one you want and complete the OAuth flow for that service.

## 2. Copy the MCP URL and API key

After connecting, Natoma will show you:

- An **MCP URL** that looks like:
  ```
  https://<integration>.mcp.natoma.app/v2/user/my-connections/mcp
  ```
- An **API key** — a 64-character hex string, e.g.:
  ```
  c57dbc8330393691141ded92c77f4ebda9d065647dca1a43bc6c1e350184c619
  ```

## 3. Add them to your `.env`

Both starters use the same env-var convention. For each MCP you want to enable, add two paired variables:

```
NATOMA_MCP_<NAME>_URL=https://<integration>.mcp.natoma.app/v2/user/my-connections/mcp
NATOMA_MCP_<NAME>_KEY=<your 64-char key>
```

`<NAME>` is just a label — use whatever you want (`GMAIL`, `LINEAR`, `INBOX`, etc.). The starter scans your env for every `NATOMA_MCP_*_URL` / `NATOMA_MCP_*_KEY` pair and registers them all as tool servers.

### Example

```env
NATOMA_MCP_GMAIL_URL=https://gmail.mcp.natoma.app/v2/user/my-connections/mcp
NATOMA_MCP_GMAIL_KEY=c57dbc8330393691141ded92c77f4ebda9d065647dca1a43bc6c1e350184c619

NATOMA_MCP_LINEAR_URL=https://linear.mcp.natoma.app/v2/user/my-connections/mcp
NATOMA_MCP_LINEAR_KEY=...

NATOMA_MCP_BRAVE_URL=https://brave.mcp.natoma.app/v2/user/my-connections/mcp
NATOMA_MCP_BRAVE_KEY=...
```

That's it — restart the agent and it will list out every tool it discovered across your MCPs.

## Auth header

The starter sends the API key as:

```
Authorization: Bearer <key>
```

If Natoma changes the convention, override the header name and scheme via:

```env
NATOMA_AUTH_HEADER=Authorization   # header name
NATOMA_AUTH_SCHEME=Bearer          # prefix; leave empty for raw key
```

For example, to switch to `X-API-Key: <key>`:

```env
NATOMA_AUTH_HEADER=X-API-Key
NATOMA_AUTH_SCHEME=
```

## Troubleshooting

- **"No tools loaded"** — Make sure each MCP has both `_URL` and `_KEY` set. The starter skips incomplete pairs.
- **401 from an MCP** — The key is wrong, or the auth header convention differs. Re-copy from Natoma and try the alternate header config above.
- **Connection hangs** — Some MCPs do a cold start on first call. Give it 10–15 seconds.
