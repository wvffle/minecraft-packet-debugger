const { PACKET_TO_CLIENT, PACKET_TO_SERVER } = require('./constants')
const { createServer, createClient } = require('minecraft-protocol')
const { EventEmitter } = require('events')

module.exports = function start (version, proxyPort = 25566, targetHost = 'localhost', targetPort = 25565) {
  let clientEnded = false
  let proxyClientEnded = false

  const emitter = new EventEmitter()

  const proxyServer = createServer({
    'online-mode': false,
    keepAlive: false,
    version,
    proxyPort
  })

  proxyServer.on('login', (client) => {
    client.on('end', () => {
      clientEnded = true
      if (!proxyClientEnded) {
        proxyClient.end()
        emitter.emit('end')
      }
    })

    client.on('error', (err) => {
      console.error('client->proxy error occured:')
      console.error(err)
      if (!proxyClientEnded) proxyClient.end()
    })

    const proxyClient = createClient({
      host: targetHost,
      port: targetPort,
      username: client.username,
      keepAlive: false,
      version
    })

    client.on('packet', (data, meta) => {
      if (proxyClient.state === states.PLAY && meta.state === states.PLAY) {
        emitter.emit(packet, PACKET_TO_SERVER, data, meta)
        if (!proxyClientEnded) proxyClient.write(meta.name, data)
      }
    })

    proxyClient.on('packet', (data, meta) => {
      if (meta.state === states.PLAY && client.state === states.PLAY) {
        emitter.emit(packet, PACKET_TO_CLIENT, data, meta)

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
      if (!clientEnded) {
        client.end()
        emitter.emit('end')
      }
    })

    proxyClient.on('error', (err) => {
      proxyClientEnded = true
      console.error('proxy->server error occured:')
      console.error(err)
      if (!clientEnded) client.end()
    })

    emitter.emit('ready')
  })

  return {
    get running () {
      return !clientEnded && !proxyClientEnded
    },
    on (...args) {
      return emitter.on(...args)
    }
  }
}
