const { name } = require('../package')
const { config: configPath } = require('env-paths')(name, { suffix: '' })
const { join } = require('path')

// Default configuration
let config = {
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

const configFile = join(configPath, 'config.json')
if (fs.existsSync(configFile)) {
  config = JSON.parse(fs.readFileSync(configFile).toString())
} else {
  // Save default config asynchronously
  save(config).then(({ error }) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.mkdirSync(configPath)
        save(config).then(({ error }) => {
          if (error) {
            console.error(error)
          }
        })
      } else {
        console.error(error)
      }
    }
  })
}

module.exports = {
  config,
  save: async function save (opts) {
    return new Promise(resolve => {
      config = opts

      fs.writeFile(configFile, JSON.stringify(opts), (err) => {
        return resolve({ error: err })
      })
    })
  }
}
