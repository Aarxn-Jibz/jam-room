export type SmtpConfig = { host: string; port: number; username: string; password: string; from: string; secure: boolean }
export type SmtpTransport = { write(data: Uint8Array): Promise<void>; nextLine(): Promise<string>; close(): Promise<void> }
export type SmtpMail = { to: string; subject: string; body: string }

const encode = (value: string) => new TextEncoder().encode(value)
async function expect(transport: SmtpTransport, expected: number[], context: string) {
  let line = await transport.nextLine(); const code = Number(line.slice(0, 3))
  if (!expected.includes(code)) throw new Error(`SMTP ${context} rejected: ${line}`)
  while (line[3] === '-') { line = await transport.nextLine(); if (Number(line.slice(0, 3)) !== code) throw new Error(`SMTP ${context} malformed multiline response`) }
}
async function command(transport: SmtpTransport, value: string, expected: number[], context: string) { await transport.write(encode(`${value}\r\n`)); await expect(transport, expected, context) }
function message(config: SmtpConfig, mail: SmtpMail) { return [`To: <${mail.to}>`, `From: <${config.from}>`, `Subject: ${mail.subject.replace(/[\r\n]/g, '')}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', '', mail.body.replace(/\r?\n\.\r?\n/g, '\r\n..\r\n')].join('\r\n') }

export async function sendSmtp(config: SmtpConfig, mail: SmtpMail, transport: SmtpTransport) {
  try { await expect(transport, [220], 'greeting'); await command(transport, 'EHLO jamroom.local', [250], 'EHLO'); await command(transport, 'AUTH LOGIN', [334], 'AUTH LOGIN'); await command(transport, btoa(config.username), [334], 'AUTH username'); await command(transport, btoa(config.password), [235], 'AUTH password'); await command(transport, `MAIL FROM:<${config.from}>`, [250], 'MAIL FROM'); await command(transport, `RCPT TO:<${mail.to}>`, [250], 'RCPT TO'); await command(transport, 'DATA', [354], 'DATA'); await transport.write(encode(`${message(config, mail)}\r\n.\r\n`)); await expect(transport, [250], 'message'); await command(transport, 'QUIT', [221], 'QUIT') } finally { await transport.close().catch(() => undefined) }
}
