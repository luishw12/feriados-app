import { ADMIN_EMAIL, EMAIL_FROM, RESEND_API_KEY } from 'astro:env/server';
import { escapeHtml } from '../markdown';

interface Mail {
  to: string;
  subject: string;
  text: string;
  link?: { href: string; label: string };
}

/** Envia via Resend; sem chave (dev) apenas imprime no console. Nunca lança erro. */
export async function sendMail(mail: Mail): Promise<void> {
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#18181b">
${mail.text
  .split('\n\n')
  .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
  .join('')}
${mail.link ? `<p><a href="${escapeHtml(mail.link.href)}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">${escapeHtml(mail.link.label)}</a></p>` : ''}
<p style="color:#71717a;font-size:12px">Feriados Brasil</p></div>`;
  if (!RESEND_API_KEY) {
    console.info(`[email] para ${mail.to}: ${mail.subject}\n${mail.text}${mail.link ? `\n${mail.link.href}` : ''}`);
    return;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM || 'Feriados Brasil <onboarding@resend.dev>',
        to: [mail.to],
        subject: mail.subject,
        text: mail.link ? `${mail.text}\n\n${mail.link.label}: ${mail.link.href}` : mail.text,
        html,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error('[email] Resend respondeu', response.status, await response.text());
  } catch (error) {
    console.error('[email] falha no envio', error);
  }
}

export function adminEmail(): string | null {
  return ADMIN_EMAIL || null;
}
