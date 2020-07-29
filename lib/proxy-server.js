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
  settings: null,

  async start (version, proxyPort = 25566, targetHost = 'localhost', targetPort = 25565) {
    // const response = await fetch(`http://${HOST}/settings`)
    // this.settings = await response.json()

    this.proxyServer = createServer({
      'online-mode': false,
      keepAlive: false,
      version,
      port: proxyPort
    })

    return new Promise((resolve, reject) => {
      this.proxyServer.on('login', (client) => {
        // console.log(client)
        console.log('client is logging in!')
        if (this.proxyClient == null) {
          this.proxyClient = createClient({
            host: 'play.nlkingdom.nl',
            // host: targetHost,
            // port: targetPort,
            // username: client.username,
            username: '',
            keepAlive: false,
            version,
            uuid: client.uuid,
            password: ''
          })
        } else {

        }

        console.log('creating a new client!')



        client.on('error', (error) => {
          console.log(error)
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

        //This will call the proxyClient
        client.on('end', () => {
          this.clientEnded = true
          console.log('ending client!')

          // if (!this.proxyClientEnded) {
          //   this.proxyClient.end()
          //   emitter.emit(this.stopping ? 'stop' : 'end')
          //   this.stopping = false
          // }
        })

        this.proxyClient.on('end', () => {
          this.proxyClientEnded = true
          console.log('ending proxy client!')
          if (!this.clientEnded) {
            client.end()
            emitter.emit(this.stopping ? 'stop' : 'end')
            this.stopping = false
          }
        })

        this.proxyClient.on('session', (session) => {
          // console.log(session)
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
