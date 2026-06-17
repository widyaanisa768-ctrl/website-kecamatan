import { useEffect, useRef } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'

export default function ValidationAlert({ errors = [], title = 'Validasi gagal', autoScroll = true, className = '', style }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!autoScroll || !Array.isArray(errors) || errors.length === 0) return
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [autoScroll, errors])

  if (!Array.isArray(errors) || errors.length === 0) return null

  return (
    <div
      ref={ref}
      className={`rk-help ${className}`.trim()}
      role="status"
      aria-live="polite"
      style={{
        marginBottom: 16,
        borderColor: 'rgba(180, 52, 52, 0.16)',
        background: 'rgba(180, 52, 52, 0.08)',
        ...style,
      }}
    >
      <div className="rk-helpIcon" aria-hidden="true" style={{ color: 'rgba(180, 52, 52, 0.95)' }}>
        <FiAlertTriangle />
      </div>
      <div className="rk-helpText">
        <strong style={{ display: 'block', marginBottom: 6 }}>{title}</strong>
        <div className="grid gap-1">
          {errors.map((err, index) => (
            <p key={index}>{err}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
