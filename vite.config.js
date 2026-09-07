import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const layoutConfigPath = resolve(rootDir, 'src', 'layout-config.js')

// 本地 dev 服务器专用：把「图片调整」编辑器保存的配置写入 src/layout-config.js。
// 该接口只存在于 `pnpm dev`，生产构建/部署后既不存在、前端也不会调用。
function layoutConfigSaver() {
  return {
    name: 'layout-config-saver',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/__layout-config') return next()

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('Method Not Allowed')
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}')
            const fileContent =
              '// 本文件由「图片调整」编辑器在本地 dev 模式保存生成，请勿手动编辑。\n' +
              `export default ${JSON.stringify(data, null, 2)}\n`
            writeFileSync(layoutConfigPath, fileContent, 'utf8')
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: true }))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: String(error?.message || error) }))
          }
        })
      })
    },
  }
}

export default {
  plugins: [layoutConfigSaver()],
}
