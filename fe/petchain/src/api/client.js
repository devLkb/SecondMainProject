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
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `요청 실패 (${res.status})`)
  }
  return data
}

export default apiFetch
