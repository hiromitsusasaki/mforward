# mforward

MoneyForward ME automation API (mfapi) client.

This CLI talks to **mfapi** (unofficial REST API) documented here:
- https://sammrai.github.io/mfapi/

## Install (dev)

```bash
npm i
npm run build
npm link
```

## Usage

Set base URL via env (default: `http://localhost:3001/api`):

```bash
export MFAPI_BASE_URL='http://localhost:3001/api'
```

List accounts:

```bash
mforward accounts
```

List assets in an account:

```bash
mforward assets list '<accountString>'
```

Create asset:

```bash
mforward assets create '<accountString>' \
  --subclass Cash \
  --name 'Wallet' \
  --value 12345
```

Output JSON:

```bash
mforward --json accounts
```

## Notes

- This project is a thin CLI wrapper around mfapi.
- `--ensure` is passed as a query param when supported by the server.
