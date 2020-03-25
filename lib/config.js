const { name } = require('../package')
const { config: configPath } = require('env-paths')(name, { suffix: '' })
const { join } = require('path')
const extend = require('deep-extend')
const fs = require('fs')

// Default configuration
const defaultConfig = {
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

let currentConfig = defaultConfig

const configFile = join(configPath, 'config.json')
if (fs.existsSync(configFile)) {
  currentConfig = extend(defaultConfig, JSON.parse(fs.readFileSync(configFile).toString()))
} else {
  // Save default config asynchronously
  save(defaultConfig).then(({ error }) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.mkdirSync(configPath)
        save(defaultConfig).then(({ error }) => {
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
  get config () {
   return currentConfig
  },
  save: async function save (config) {
    return new Promise(resolve => {
      fs.writeFile(configFile, JSON.stringify(config), (err) => {
        return resolve({ error: err })
      })
    })
  }
}
