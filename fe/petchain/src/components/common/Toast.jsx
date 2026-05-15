import { useEffect } from 'react'

export default function Toast({ title, msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="toast">
      <div className="toast-step">{title}</div>
      <div>{msg}</div>
    </div>
  )
}
