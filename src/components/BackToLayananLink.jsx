import { FiArrowLeft } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function BackToLayananLink() {
  return (
    <div className="rk-formBackRow">
      <Link
        to="/layanan"
        className="rk-backLink"
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
      >
        <FiArrowLeft aria-hidden="true" />
        <span>Kembali ke Layanan</span>
      </Link>
    </div>
  )
}
