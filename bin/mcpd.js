#!/usr/bin/env node

'use strict'

const { config } = require('../lib/config')
const program = require('commander')
program.version(require('../package.json').version)
  .option('-p, --port <number>', 'Port to run on. Default: 3000')
  .parse(process.argv)

if (program.port === '1234') {
  console.error('Port 1234 is reserved for developing')
  return
}

const proxy = require('../lib/proxy-server')
const web = require('../lib/web-server')

;(async function () {
  proxy.setSettings(config)
  proxy.start()
  const webPort = await web.listen(program.port || 3000)

  web.bindProxyInstance(proxy)

  console.log(`Proxy server listening on 25566`)
  console.log(`Web interface listening on ${webPort}`)
})()
