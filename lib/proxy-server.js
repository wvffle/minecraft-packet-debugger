const { PACKET_TO_CLIENT, PACKET_TO_SERVER } = require('./constants')
const { createServer, createClient } = require('minecraft-protocol')
const { EventEmitter } = require('events')

const protocol = require('minecraft-protocol')
const { states } = protocol

const emitter = new EventEmitter()

module.exports = {
  clientEnded: false,
  proxyClientEnded: false,
  stopping: false,
  proxyServer: null,
  proxyClient: null,

  async start (version, proxyPort = 25566, targetHost = 'localhost', targetPort = 25565) {
    this.proxyServer = createServer({
      'online-mode': false,
      keepAlive: false,
      version,
      port: proxyPort
    })

    return new Promise((resolve, reject) => {
      this.proxyServer.on('login', (client) => {
        this.proxyClient = createClient({
          host: targetHost,
          port: targetPort,
          username: client.username,
          keepAlive: false,
          version
        })

        // ===
        // Packet binding
        // ===

        client.on('packet', (data, meta) => {
          if (this.proxyClient.state === states.PLAY && meta.state === states.PLAY) {
            emitter.emit('packet', PACKET_TO_SERVER, data, meta)

            if (!this.proxyClientEnded) {
              this.proxyClient.write(meta.name, data)
            }
          }
        })

        this.proxyClient.on('packet', (data, meta) => {
          if (meta.state === states.PLAY && client.state === states.PLAY) {
            emitter.emit('packet', PACKET_TO_CLIENT, data, meta)

            if (!this.clientEnded) {
              client.write(meta.name, data)

              if (meta.name === 'set_compression') {
                client.compressionThreshold = data.threshold
              }
            }
          }
        })

        // ===
        // End handlers
        // ===

        this.proxyClient.on('end', () => {
          this.proxyClientEnded = true

          if (!this.clientEnded) {
            client.end()
            emitter.emit(this.stopping ? 'stop' : 'end')
            this.stopping = false
          }
        })

        client.on('end', () => {
          this.clientEnded = true

          if (!this.proxyClientEnded) {
            this.proxyClient.end()
            emitter.emit(this.stopping ? 'stop' : 'end')
            this.stopping = false
          }
        })

        // ===
        // Error handlers
        // ===

        this.proxyClient.on('error', (err) => {
          this.proxyClientEnded = true
          if (!this.clientEnded) client.end()

          err.layer = PACKET_TO_SERVER
          return reject(err)
        })

        client.on('error', (err) => {
          if (!this.proxyClientEnded) {
            this.proxyClient.end()
          }

          err.layer = PACKET_TO_CLIENT
          return reject(err)
        })

      })
    })
  },

  async restart () {
    await this.stop()
    return this.start()
  },

  async stop () {
    this.stopping = true
    this.proxyServer.stop()
  },

  get running () {
    return !this.clientEnded && !this.proxyClientEnded
  },

  on (...args) {
    return emitter.on(...args)
  },

  once (...args) {
    return emitter.once(...args)
  }
}
