const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV,
})

const db = app.database()

function parsePayload(event) {
  if (!event) return {}

  if (event.name || event.phone) return event
  if (event.data?.name || event.data?.phone) return event.data
  if (event.queryStringParameters?.name || event.queryStringParameters?.phone) {
    return event.queryStringParameters
  }

  const body = event.body ?? event.rawBody ?? event.request?.body
  if (!body) return {}
  if (typeof body === 'object') return body

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
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      body: '',
    }
  }

  if (event.httpMethod && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    }
  }

  const payload = parsePayload(event)

  const name = String(payload.name || '').trim()
  const phone = String(payload.phone || '').trim()
  const guestCount = Number(payload.guestCount)

  if (!name || !phone || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Name, phone and a valid guest count are required' }),
    }
  }

  await db.collection('guests').add({
    name,
    phone,
    guestCount,
    createdAt: new Date(),
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  }
}
