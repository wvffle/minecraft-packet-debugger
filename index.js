const fastify = require('fastify')({ logger: false })
const protocol = require('minecraft-protocol')
const mcdata = require('minecraft-data')
const fs = require('fs')
const ext = require('ext-name')
const msgpack = require('msgpack-lite')
const path = require('path')
const { EventEmitter } = require('events')

const { states } = protocol

fastify.register(require('fastify-websocket'))

module.exports = (port) => {


  function isIgnored (packet) {
    const { world, game, entity, custom } = settings.ignoredPackets
    return world[packet] || game[packet] || entity[packet] || custom[packet]
  }

  function broadcast (type, data) {
    fastify.websocketServer.clients.forEach(client => {
      if (client.readyState !== 1 || isIgnored(data.packet.meta.name)) return
      client.send(msgpack.encode({ type, ...data }))
    })
  }

  fastify.get('/', async (request, reply) => {
    reply.type('html')
    return fs.createReadStream('public/index.html', 'utf8')
  })

  fastify.get('/settings', async (request, reply) => {
    return settings
  })

  fastify.get('/host', async (request, reply) => {
    return { host: settings.server.host, version: globalVersion, packets: getPackets(globalVersion) }
  })

  fastify.post('/settings', async (request, reply) => {
    const data = JSON.parse(request.body)
    if (data.server.host !== settings.server.host || data.server.proxyPort !== settings.server.proxyPort) {
      const { error } = await saveSettings(data)
      if (error) {
        return { error }
      }

      return startProxyServer()
    }

    const { error } = await saveSettings(data)
    if (error) {
      return { error }
    }

    return { version: globalVersion, packets: getPackets(globalVersion) }
  })

  fastify.get('/:file', async (request, reply) => {
    reply.type(ext(request.params.file)[0].mime)
    return fs.createReadStream(`public/${request.params.file}`, 'utf8')
  })

  let globalVersion = '0.0.0'

  async function startProxyServer () {
    return new Promise(resolve => {
      protocol.ping({
        host: settings.server.host.split(':')[0] || 'localhost',
        port: +settings.server.host.split(':')[1] || 25565
      }, async (err, result) => {

        // Only supporting PC versions right now

        await createProxyServer(+settings.server.proxyPort, version.minecraftVersion)
        return resolve({ version: version.minecraftVersion, packets: getPackets(version.minecraftVersion) })
      })
    })
  }

  fastify.get('/ws', { websocket: true }, async (connection, request) => {

  })

  fastify.listen(port, err => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }

    console.log(`Listening on http://localhost:${port}`)
  })

  startProxyServer().then(({ error }) => {
    if (error) {
      console.log(error)
    }
  })
}

const emitter = new EventEmitter()
module.exports = emitter

emitter.on('packet', (data, meta) => {

})

emitter.runProxy = async function () {

}
