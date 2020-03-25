const { ping } = require('minecraft-protocol')
const { versions } = require('minecraft-data')
const { config } = require('./config')

const packets = {}
function getPacketsForVersion (version) {
  if (packets[version]) {
    return packets[version]
  }

  try {
    const protocol = require(`minecraft-data/minecraft-data/data/pc/${version}/protocol`)
    packets[version] = {
      toClient: Object.keys(protocol.play.toClient.types).map(p =>p.slice(7)).filter(p => p),
      toServer: Object.keys(protocol.play.toServer.types).map(p =>p.slice(7)).filter(p => p)
    }

    return packets[version]
  } catch {
    return null
  }
}

async function getServerVersions (host = 'localhost', port = 25565) {
  return new Promise(resolve => {
    ping({ host, port }, (err, info) => {
      if (err) {
        return resolve({ error: `Cannot ping ${host}:${port}` })
      }
 version = versions.pc.find(({ version }) => version === info.version.protocol)

      // TODO: Find all supported versions not only one
      if (!version) {
        return resolve({ error: `Cannot detect version from string ${info.version.protocol}` })
      }

      return resolve({ version: version.minecraftVersion })
    })
  })
}

function isIgnored (packet) {
  const { world, game, entity, custom } = config.ignoredPackets
  return world[packet] || game[packet] || entity[packet] || custom[packet]
}


module.exports = {
  getPacketsForVersion,
  getServerVersions,
  isIgnored
}
