/**
 * Notifications (optional)
 *
 * Discord: set DISCORD_WEBHOOK_URL and DISCORD_MENTION (e.g. <@123...>)
 * Telegram: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 */

type NotifyOpts = {
  title?: string;
  body: string;
};

async function postJson(url: string, payload: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`notify http ${res.status}: ${txt}`);
  }
}

export async function notify(opts: NotifyOpts) {
  const errors: string[] = [];

  const title = opts.title ? `${opts.title}\n` : '';

  // Discord via webhook
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    try {
      const mention = process.env.DISCORD_MENTION || '';
      const content = `${mention} ${title}${opts.body}`.trim();
      await postJson(discordWebhook, { content });
    } catch (e: any) {
      errors.push(`discord: ${e?.message || String(e)}`);
    }
  }

  // Telegram via bot
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    try {
      const url = `https://api.telegram.org/bot${tgToken}/sendMessage`;
      const text = `${title}${opts.body}`.trim();
      await postJson(url, { chat_id: tgChat, text, disable_web_page_preview: true });
    } catch (e: any) {
      errors.push(`telegram: ${e?.message || String(e)}`);
    }
  }

  if (discordWebhook || (tgToken && tgChat)) {
    if (errors.length) throw new Error(errors.join(' | '));
    return;
  }

  // Fallback: stderr only
  console.error(`[notify] ${title}${opts.body}`);
}
