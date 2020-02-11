const fastify = require('fastify')({ logger: false })
const protocol = require('minecraft-protocol')
const mcdata = require('minecraft-data')
const fs = require('fs')
const ext = require('ext-name')
const msgpack = require('msgpack-lite')

const { states } = protocol

fastify.register(require('fastify-websocket'))

let settings = {
  ignoredPackets: {
    game: {
      keep_alive: true,
      update_time: true,
      game_state_change: true,
    },

    world: {
      map_chunk: true,
      unload_chunk: true,
      block_change: true,
      multi_block_change: true,
    },

    entity: {
      entity_velocity: true,
      entity_destroy: true,
      entity_head_rotation: true,
      entity_teleport: true,
      entity_status: true,
      entity_move_look: true,
      rel_entity_move: true,
      entity_equipment: true,
      entity_metadata: true,
      entity_update_attributes: true,
    },

    custom: {
      look: true,
      position: true,
      position_look: true,
      arm_animation: true
    }
  },
  server: {
    host: 'localhost',
    proxyPort: 25566
  }
}

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
  return { host: settings.server.host, version: globalVersion }
})

fastify.post('/settings', async (request, reply) => {
  const data = JSON.parse(request.body)
  if (data.server.host !== settings.server.host || data.server.proxyPort !== settings.server.proxyPort) {
    settings = data
    return startProxyServer()
  }

  settings = data
  return { version: globalVersion }
})

fastify.get('/:file', async (request, reply) => {
  reply.type(ext(request.params.file)[0].mime)
  return fs.createReadStream(`public/${request.params.file}`, 'utf8')
})

let globalVersion = '0.0.0'
let proxyServer
let proxyClient
async function createProxyServer (port, version) {
  if (proxyServer) {
    proxyServer.close()
    proxyServer = null
  }

  if (proxyClient) {
    proxyClient.end()
    proxyClient = null
  }

  globalVersion = version

  return new Promise((resolve) => {
    proxyServer = protocol.createServer({
      'online-mode': false,
      keepAlive: false,
      version,
      port
    })

    proxyServer.on('login', (client) => {
      let clientEnded = false
      let proxyClientEnded = false

      client.on('end', () => {
        clientEnded = true
        if (!proxyClientEnded) proxyClient.end()
      })

      client.on('error', (err) => {
        console.log(err)
        if (!proxyClientEnded) proxyClient.end()
      })

      proxyClient = protocol.createClient({
        host: settings.server.host.split(':')[0] || 'localhost',
        port: +settings.server.host.split(':')[1] || 25565,
        username: client.username,
        keepAlive: false,
        version
      })

      client.on('packet', (data, meta) => {
        if (proxyClient.state === states.PLAY && meta.state === states.PLAY) {
          broadcast('packet', {
            packet: { data, meta, to: 1 }
          })

          if (!proxyClientEnded) proxyClient.write(meta.name, data)
        }
      })

      proxyClient.on('packet', (data, meta) => {
        if (meta.state === states.PLAY && client.state === states.PLAY) {
          broadcast('packet', {
            packet: { data, meta, to: 0 }
          })

          if (!clientEnded) {
            client.write(meta.name, data)

            if (meta.name === 'set_compression') {
              client.compressionThreshold = data.threshold
            }
          }
        }
      })

      proxyClient.on('end', () => {
        proxyClientEnded = true
        if (!clientEnded) client.end()
      })

      proxyClient.on('error', (err) => {
        proxyClientEnded = true
        console.log(err)
        if (!clientEnded) client.end()
      })
    })

    resolve()
  })
}

async function startProxyServer () {
  return new Promise(resolve => {
    protocol.ping({
      host: settings.server.host.split(':')[0] || 'localhost',
      port: +settings.server.host.split(':')[1] || 25565
    }, async (err, result) => {
      if (err) {
        return resolve({ error: `Cannot ping ${settings.server.host}` })
      }

      // Only supporting PC versions right now
      const version = mcdata.versions.pc.find(({ version }) => version === result.version.protocol)

      if (!version) {
        return resolve({ error: `Cannot detect version from string ${result.version.protocol}` })
      }

      await createProxyServer(+settings.server.proxyPort, version.minecraftVersion)
      return resolve({ version: version.minecraftVersion })
    })
  })
}

fastify.get('/ws', { websocket: true }, async (connection, request) => {

})

fastify.listen(3000, err => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

startProxyServer().then(({ error }) => {
  if (error) {
    console.log(error)
  }
})
