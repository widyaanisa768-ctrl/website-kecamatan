import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const behavior =
      typeof window !== 'undefined' && window.sessionStorage.getItem('rk-scroll-behavior') === 'smooth'
        ? 'smooth'
        : 'auto'

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('rk-scroll-behavior')
    }

    window.scrollTo({ top: 0, left: 0, behavior })
  }, [pathname])

  return null
}
