#!/usr/bin/env node

'use strict'


const program = require('commander')
program.version(require('../package.json').version)
  .option('-p, --port <number>', 'Port to run on. Default: 3000')
  .parse(process.argv)

if (program.port === '1234') {
  console.error('Port 1234 is reserved for developing')
  return
}

const debug = require('../')
debug.runProxy(+program.port || 3000)
