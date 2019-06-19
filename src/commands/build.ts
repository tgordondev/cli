/**
 * Author: Brett Campbell (brett@hackcapital.com)
 * Date: Saturday, 6th April 2019 10:39:58 pm
 * Last Modified By: Brett Campbell (brett@hackcapital.com)
 * Last Modified Time: Saturday, 6th April 2019 10:40:00 pm
 *
 * DESCRIPTION
 *
 */
import * as path from 'path'
import Docker from 'dockerode'

import Command, { flags } from '../base'
import { Container, Op, OpsYml } from '../types'

import { ux } from '@cto.ai/sdk'
import * as fs from 'fs-extra'
import * as yaml from 'yaml'
import {
  FileNotFoundError,
  InvalidInputCharacter,
  MissingRequiredArgument,
  NoOpsFound,
} from '../errors/customErrors'
import { getOpUrl, getOpImageTag } from '../utils/getOpUrl'
import { OPS_REGISTRY_HOST } from '../constants/env'
import { OP_FILE } from '../constants/opConfig'
import { isValidOpName } from '../utils/validate'
import getDocker from '~/utils/get-docker'
import { thisExpression } from '@babel/types'

export default class Build extends Command {
  static description = 'Build your op for sharing.'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  static args = [
    { name: 'path', description: 'Path to the op you want to build.' },
  ]

  docker: Docker | undefined

  async run(this: any) {
    try {
      this.docker = await getDocker(this, 'build')

      const { args } = this.parse(Build)
      if (!args.path) throw new MissingRequiredArgument('ops [command]')

      const opPath: string = args.path
        ? path.resolve(process.cwd(), args.path)
        : process.cwd()

      this.isLoggedIn()

      const manifest = await fs
        .readFile(path.join(opPath, OP_FILE), 'utf8')
        .catch(err => {
          this.debug('%O', err)
          throw new FileNotFoundError(err, opPath, OP_FILE)
        })
      let { ops }: OpsYml = manifest && yaml.parse(manifest)
      if (!ops) {
        throw new NoOpsFound()
      }

      if (ops.length > 1) {
        const answers = await ux.prompt<Container<Op[]>>({
          type: 'checkbox',
          name: 'ops',
          message: `\n Which ops would you like to build ${ux.colors.reset.green(
            '→',
          )}`,
          choices: ops.map(op => {
            return {
              value: op,
              name: `${op.name} - ${op.description}`,
            }
          }),
          validate: input => input.length > 0,
        })
        ops = answers.ops
      }

      await this.opsBuildLoop(ops, opPath)
    } catch (err) {
      this.debug('%O', err)
      this.config.runHook('error', { err })
    }
  }

  opsBuildLoop = async (ops, opPath) => {
    for (const op of ops) {
      if (!isValidOpName(op)) throw new InvalidInputCharacter('Op Name')

      this.log(
        `🛠  ${ux.colors.white('Building:')} ${ux.colors.callOutCyan(opPath)}\n`,
      )
      const opImageTag = getOpImageTag(this.team.name, op.name)

      await this.config.runHook('build', {
        tag: getOpUrl(OPS_REGISTRY_HOST, opImageTag),
        opPath,
        op,
      })

      this.analytics.track({
        userId: this.user.email,
        event: 'Ops CLI Build',
        properties: {
          email: this.user.email,
          username: this.user.username,
          name: op.name,
          description: op.description,
          image: `${OPS_REGISTRY_HOST}/${op.name}`,
        },
      })
    }
  }
}
