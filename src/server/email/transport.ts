import { connect } from 'cloudflare:sockets'
import type { SmtpTransport } from './smtp.js'

export function createSmtpTransport(connection: { host: string; port: number; secure: boolean }): SmtpTransport {
  const socket = connect({ hostname: connection.host, port: connection.port }, { secureTransport: connection.secure ? 'on' : 'off', allowHalfOpen: true }); const writer = socket.writable.getWriter(); const reader = socket.readable.getReader(); let buffer = ''
  return { write: async data => { await writer.write(data) }, nextLine: async () => { for (;;) { const newline = buffer.indexOf('\n'); if (newline >= 0) { const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1); return line.replace(/\r$/, '') } const chunk = await reader.read(); if (chunk.done) throw new Error('SMTP connection closed by server'); buffer += new TextDecoder().decode(chunk.value) } }, close: async () => { await socket.close().catch(() => undefined) } }
}
