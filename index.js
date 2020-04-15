const mcdata = require('minecraft-data')
const path = require('path')
const { EventEmitter } = require('events')
const { config } = require('./lib/config')



const emitter = new EventEmitter()
module.exports = emitter

emitter.on('packet', (data, meta) => {

})

emitter.runProxy = async function (port) {
  let globalVersion = '0.0.0'

  async function startProxyServer () {
    return new Promise(resolve => {
      protocol.ping({
        host: config.server.host.split(':')[0] || 'localhost',
        port: +config.server.host.split(':')[1] || 25565
      }, async (err, result) => {

        // Only supporting PC versions right now

        await createProxyServer(+config.server.proxyPort, version.minecraftVersion)
        return resolve({ version: version.minecraftVersion, packets: getPackets(version.minecraftVersion) })
      })
    })
  }



  startProxyServer().then(({ error }) => {
    if (error) {
      console.log(error)
    }
  })
}
