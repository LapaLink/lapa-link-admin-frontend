const FRAGMENT = (name: string) =>
  new RegExp(`<th:block[^>]*th:fragment="${name}"[^>]*>([\\s\\S]*?)</th:block>`)

const EXPRESSION = /\[\[(\$\{[^}]*\})\]\]|\[\((\$\{[^}]*\})\)\]/g

export function splitTemplate(content: string) {
  const subject = content.match(FRAGMENT("subject"))?.[1]?.trim() ?? null
  const body = content.match(FRAGMENT("body"))?.[1]?.trim() ?? content
  return { subject, body }
}

export function highlightExpressions(html: string) {
  return html.replace(
    EXPRESSION,
    (_, escaped, raw) =>
      `<mark style="background:#fde7c7;color:#7a3e00;border-radius:4px;padding:0 3px;font-family:ui-monospace,monospace;font-size:0.85em">${escaped ?? raw}</mark>`
  )
}

export function buildPreviewDocument(body: string, channel: "EMAIL" | "IN_APP") {
  const content = highlightExpressions(body)
  const frame =
    channel === "EMAIL"
      ? `<div style="background:#f5f2ee;padding:32px 16px;min-height:100%;box-sizing:border-box">
           <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px 28px;font-size:15px;line-height:1.6;color:#1f1d1a">${content}</div>
           <p style="max-width:560px;margin:20px auto 0;font-size:12px;color:#8a847c">© LapaLink</p>
         </div>`
      : `<div style="padding:24px;background:#f5f2ee;min-height:100%;box-sizing:border-box">
           <div style="max-width:420px;background:#fff;border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.5;color:#1f1d1a;box-shadow:0 1px 2px rgb(0 0 0/0.06)">${content}</div>
         </div>`

  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif}</style></head><body>${frame}</body></html>`
}
