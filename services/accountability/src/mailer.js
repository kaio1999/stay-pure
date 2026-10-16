import nodemailer from 'nodemailer';

export function createMailer(env = process.env) {
  const host = env.SMTP_HOST ?? '';
  const port = env.SMTP_PORT ?? '587';
  const user = env.SMTP_USER ?? '';
  const pass = env.SMTP_PASS ?? '';
  const from = env.SMTP_FROM ?? '';

  const ready = Boolean(host && from);
  let transporter = null;

  if (ready) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: false,
      auth: user ? { user, pass } : undefined,
    });
  }

  return {
    ready,
    async send(to, subject, body) {
      if (!ready) {
        console.log(`smtp ausente; e-mail para ${to}\n${subject}\n${body}`);
        return;
      }
      await transporter.sendMail({
        from,
        to,
        subject,
        text: body,
      });
    },
  };
}
