import * as Flags from 'country-flag-icons/react/3x2'

export default function Flag({ code, size = 28 }) {
  if (!code) return <span style={{ fontSize: size }}>🏳️</span>

  const key = code.toUpperCase().replace(/-/g, '_')
  const FlagComponent = Flags[key]

  if (!FlagComponent) return <span style={{ fontSize: size }}>🏳️</span>

  return (
    <FlagComponent
      width={Math.round(size * 1.5)}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2, flexShrink: 0 }}
    />
  )
}
