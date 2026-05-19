const RAW_BASE_URL = (import.meta.env.VITE_API_URL || '').trim()
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL
const IS_DEV = !!import.meta.env.DEV

if (IS_DEV) {
  console.log('[api] VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('[api] BASE_URL:', BASE_URL)
}

function getStoredToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('accessToken') || window.localStorage.getItem('token') || ''
}

function buildUrl(path) {
  if (!path) return BASE_URL
  if (/^https?:\/\//i.test(path)) return path

  if (!BASE_URL) return path.startsWith('/') ? path : `/${path}`
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}${normalized}`
}

async function readJsonSafe(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers: extraHeaders,
    withAuth = true,
    timeoutMs = 12000,
    signal,
  } = options

  const finalUrl = buildUrl(path)

  if (IS_DEV) {
    if (!BASE_URL) {
      console.log('[api] WARNING: VITE_API_URL is empty/undefined. Request will use relative URL.')
    }
    console.log('[api] request url:', finalUrl)
    console.log('[api] request method:', method)
    console.log('[api] request body:', body === undefined ? null : body)
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  }

  if (withAuth) {
    const token = getStoredToken()
    if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeoutId =
    controller && typeof window !== 'undefined'
      ? window.setTimeout(() => controller.abort(), Math.max(0, timeoutMs))
      : null

  let res
  try {
    res = await fetch(finalUrl, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller?.signal || signal,
    })
  } catch (err) {
    if (timeoutId) window.clearTimeout(timeoutId)
    if (IS_DEV) console.log('[api] fetch error:', err)
    throw err
  }

  if (timeoutId) window.clearTimeout(timeoutId)

  const data = await readJsonSafe(res)
  if (IS_DEV) {
    console.log('[api] response status:', res.status)
    console.log('[api] response ok:', res.ok)
    console.log('[api] response data:', data)
  }
  return {
    ok: res.ok,
    status: res.status,
    data,
  }
}
