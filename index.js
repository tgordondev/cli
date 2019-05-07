#!/usr/bin/env node --preserve-symlinks
const fs = require('fs')
const dotenv = require('dotenv-safe')

// first configure app using .env
dotenv.config()

// override those variables based on environment
const envFile = fs.readFileSync(`.env.${process.env.NODE_ENV}`)
const envConfig = dotenv.parse(envFile)
for (let k in envConfig) {
  process.env[k] = envConfig[k]
}
if (process.env.DEBUG) {
  console.log({ envConfig })
}

// run the command
require('@oclif/command')
  .run()
  .then(require('@oclif/command/flush'))
  .catch(require('@oclif/errors/handle'))
