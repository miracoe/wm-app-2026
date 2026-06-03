function toFlagEmoji(code) {
  if (!code || code.length !== 2) return '🏳️'
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  )
}

export default function Flag({ code, size = 28 }) {
  return (
    <span style={{ fontSize: size }} aria-label={code} role="img">
      {toFlagEmoji(code)}
    </span>
  )
}
