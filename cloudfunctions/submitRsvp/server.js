const http = require('http')
const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV,
})

const db = app.database()

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024 * 20) {
        reject(new Error('Request body too large'))
        req.destroy()
      }
    })

    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Method Not Allowed' })
    return
  }

  try {
    const rawBody = await readBody(req)
    const payload = JSON.parse(rawBody || '{}')
    const name = String(payload.name || '').trim()
    const phone = String(payload.phone || '').trim()

    if (!name || !phone) {
      sendJson(res, 400, { message: 'Name and phone are required' })
      return
    }

    await db.collection('guests').add({
      name,
      phone,
      createdAt: new Date(),
    })

    sendJson(res, 200, { ok: true })
  } catch (error) {
    console.error(error)
    sendJson(res, 500, { message: 'Internal Server Error' })
  }
})

server.listen(9000, '0.0.0.0', () => {
  console.log('submitRsvp HTTP function listening on 9000')
})
