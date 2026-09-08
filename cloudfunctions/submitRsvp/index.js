const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV,
})

const db = app.database()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
    body: JSON.stringify(data),
  }
}

function parsePayload(event) {
  if (!event) return {}

  if (event.name || event.phone) return event
  if (event.data?.name || event.data?.phone) return event.data
  if (event.queryStringParameters?.name || event.queryStringParameters?.phone) {
    return event.queryStringParameters
  }

  const body = event.body ?? event.rawBody ?? event.request?.body
  if (!body) return {}
  if (typeof body === 'object' && !Buffer.isBuffer(body)) return body

  const rawBody = event.isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body
  const trimmedBody = String(rawBody || '').trim()
  if (!trimmedBody) return {}

  try {
    return JSON.parse(trimmedBody)
  } catch {
    return Object.fromEntries(new URLSearchParams(trimmedBody))
  }
}

exports.main = async (event) => {
  // 跨域预检：必须带上 CORS 头，否则浏览器会拦截后续 POST
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    }
  }

  if (event.httpMethod && event.httpMethod !== 'POST') {
    return jsonResponse(405, { message: 'Method Not Allowed' })
  }

  const payload = parsePayload(event)

  const name = String(payload.name || '').trim()
  const phone = String(payload.phone || '').trim()
  const guestCount = Number(payload.guestCount)

  if (!name || !phone || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
    return jsonResponse(400, { message: 'Name, phone and a valid guest count are required' })
  }

  try {
    await db.collection('guests').add({
      name,
      phone,
      guestCount,
      createdAt: new Date(),
    })

    return jsonResponse(200, { ok: true })
  } catch (error) {
    // 把真实错误返回给前端，便于排查（比如集合不存在、权限不足）
    console.error('写入回执失败:', error)
    return jsonResponse(500, {
      ok: false,
      message: String((error && error.message) || error),
    })
  }
}
