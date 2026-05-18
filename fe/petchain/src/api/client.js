class ApiError extends Error {
  constructor({ message, status, errorCode, traceId, details }) {
    super(message || `요청 실패 (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
    this.traceId = traceId
    this.details = details || {}
  }
}

async function apiFetch(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const accessToken = localStorage.getItem('accessToken')

  const reqHeaders = { ...headers }
  if (accessToken) {
    reqHeaders['Authorization'] = `Bearer ${accessToken}`
  }
  if (!isFormData && body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json'
  }

  const options = { method, headers: reqHeaders }
  if (body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body)
  }

  const res = await fetch(`/api${path}`, options)
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError({
      message: payload.message,
      status: res.status,
      errorCode: payload.errorCode,
      traceId: payload.traceId,
      details: payload.details,
    })
  }

  // petchainAPI 표준 응답(ApiResponse<T>)은 data를 반환하고,
  // auth/pets 등 기존 raw 응답은 그대로 반환한다.
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data') && Object.prototype.hasOwnProperty.call(payload, 'traceId')) {
    return payload.data
  }
  return payload
}

export { ApiError }
export default apiFetch
