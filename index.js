const fastify = require('fastify')({ logger: false })
const protocol = require('minecraft-protocol')
const fs = require('fs')
const ext = require('ext-name')
const msgpack = require('msgpack-lite')

const { states } = protocol

fastify.register(require('fastify-websocket'))

function broadcast (type, data) {
  fastify.websocketServer.clients.forEach(client => {
    if (client.readyState !== 1) return
    client.send(msgpack.encode({ type, ...data }))
  })
}

fastify.get('/', async (request, reply) => {
  reply.type('html')
  return fs.createReadStream('public/index.html', 'utf8')
})

fastify.get('/:file', async (request, reply) => {
  reply.type(ext(request.params.file)[0].mime)
  return fs.createReadStream(`public/${request.params.file}`, 'utf8')
})

const proxyServer = protocol.createServer({
  'online-mode': false,
  port: 25566,
  keepAlive: false,
  version: data.version
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
    host: 'localhost',
    port: 25565,
    username: client.username,
    keepAlive: false,
    version: '1.12.2'
  })

  client.on('packet', (data, meta) => {
    if (proxyClient.state === states.PLAY && meta.state === states.PLAY) {
      broadcast('packet:server', {
        packet: { data, meta }
      })

      if (!proxyClientEnded) proxyClient.write(meta.name, data)
    }
  })

  proxyClient.on('packet', (data, meta) => {
    if (meta.state === states.PLAY && client.state === states.PLAY) {
      broadcast('packet:client', {
        packet: { data, meta }
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

fastify.get('/ws', { websocket: true }, async (connection, request) => {
  let proxyClient
  connection.socket.on('close', () => {
    proxyClient.end()
    proxyServer.close()
  })

  connection.socket.on('message', message => {
    const data = msgpack.decode(message)
    switch (data.type) {

    }
  })
})

fastify.listen(3000, err => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
