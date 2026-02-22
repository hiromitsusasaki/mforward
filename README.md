# mforward

MoneyForward ME helper CLI: **browser automation** (manual login → session reuse) using Playwright.

## Why
- Avoid storing MoneyForward credentials in the CLI
- Handle 2FA by **human-in-the-loop** login
- Reuse session via a dedicated Chrome profile (Playwright persistent context)

## Install (dev)

```bash
npm i
npm run build
npm link
```

## Quick start

1) Open Chrome with a dedicated automation profile and log in:

```bash
mforward open --url 'https://moneyforward.com/'
```

2) Fetch a page (saves HTML + screenshot under `./data/raw/`):

```bash
mforward fetch page --url 'https://moneyforward.com/'
```

If the CLI detects you are logged out, it will ask you to run `mforward open` again.

## Profile & data directories

- Profile (default): `~/.config/mforward/chrome-profile`
- Data (default): `./data`

Override:

```bash
mforward --user-data-dir /path/to/profile --data-dir /path/to/data ...
```

## Notifications (optional)

### Discord (recommended)
Use a Discord incoming webhook:

- `DISCORD_WEBHOOK_URL`: webhook URL
- `DISCORD_MENTION`: mention string like `<@YOUR_USER_ID>`

### Telegram
Use a Telegram bot:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

If none are set, notifications fall back to stderr.

## Notes
- Avoid using your daily Chrome profile directly.
- Automation may break if MF changes UI; this CLI stores evidence (HTML/screenshot) to iterate parsers safely.
