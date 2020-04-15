const fastify = require('fastify')({ logger: false })
const msgpack = require('msgpack-lite')
const ext = require('ext-name')
const fs = require('fs')
const { isIgnored, getPacketsForVersion } = require('./utils')
const { config, save: saveConfig } = require('./config')

let proxyInstance = null

// ===
// Main view
// ===

fastify.get('/', async (request, reply) => {
  reply.type('html')
  return fs.createReadStream(`${__dirname}/../public/index.html`, 'utf8')
})

// ===
// Data layer
// ===

fastify.get('/host', async (request, reply) => {
  if (proxyInstance === null) {
    return { error: 'Proxy instance is not bound' }
  }

  return {
    host: config.server.host,
    version: proxyInstance.version,
    packets: getPacketsForVersion(proxyInstance.version)
  }
})

fastify.get('/settings', async () => {
  return config
})

fastify.post('/settings', async (request, reply) => {
  if (proxyInstance === null) {
    return { error: 'Proxy instance is not bound' }
  }

  const data = JSON.parse(request.body)

  const { error } = await saveConfig(data)
  if (error) {
    // TODO: Check if we can throw this
    return { error }
  }

  if (data.server.host !== config.server.host || data.server.proxyPort !== config.server.proxyPort) {
    return proxyInstance.restart()
  }

  return {
    version: proxyInstance.version,
    packets: getPacketsForVersion(proxyInstance.version)
  }
})

// ===
// Websocket stuff
// ===

fastify.register(require('fastify-websocket'))
fastify.get('/ws', { websocket: true }, async () => {})

function broadcast (type, data) {
  fastify.websocketServer.clients.forEach(client => {
    if (client.readyState !== 1 || isIgnored(data.packet.meta.name)) return
    client.send(msgpack.encode({ type, ...data }))
  })
}

// ===
// Public assets
// ===

fastify.get('/:file', async (request, reply) => {
  reply.type(ext(request.params.file)[0].mime)
  return fs.createReadStream(`${__dirname}/../public/${request.params.file}`, 'utf8')
})

module.exports = {
  async listen (port) {
    return new Promise((resolve, reject) => {
      fastify.listen(port, err => {
        if (err) {
          return reject(err)
        }

        return resolve(port)
      })
    })
  },
  bindProxyInstance (instance) {
    proxyInstance = instance

    instance.on('packet', (to, data, meta) => {
      broadcast(to, {
        packet: { to, data, meta }
      })
    })
  },
  broadcast,
}
