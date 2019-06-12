/**
 * @author: Brett Campbell (brett@hackcapital.com)
 * @date: Friday, 5th April 2019 12:06:07 pm
 * @lastModifiedBy: Prachi Singh (prachi@hackcapital.com)
 * @lastModifiedTime: Friday, 3rd May 2019 4:57:32 pm
 * @copyright (c) 2019 CTO.ai
 */

import { ux } from '@cto.ai/sdk'
import through from 'through2'
import json from 'JSONStream'

import { Op } from '../types'
import getDocker from '../utils/get-docker'
import { ReadFileError, DockerBuildImageError } from '../errors/customErrors'

async function build(
  this: any,
  options: { tag: string; opPath: string; op: Op },
) {
  const { opPath, tag, op } = options

  const all: any[] = []
  const log = this.log
  let parser = through.obj(function(this: any, chunk: any, _enc: any, cb: any) {
    if (chunk.stream && chunk.stream !== '\n') {
      this.push(chunk.stream.replace('\n', ''))
      log(chunk.stream.replace('\n', ''))
      all.push(chunk)
    } else if (chunk.errorDetail) {
      this.debug(chunk.errorDetail)
      throw new ReadFileError(chunk.errorDetail.message)
    }
    cb()
  })

  const _pipe = parser.pipe
  parser.pipe = function(dest: any) {
    return _pipe(dest)
  }
  await new Promise(async function(resolve, reject) {
    const self = this
    const docker = await getDocker(self, 'build')

    if (docker) {
      const stream = await docker
        .buildImage({ context: opPath, src: op.src }, { t: tag })
        .catch(err => {
          this.debug('%O', err)
          reject(new DockerBuildImageError(err))
          return null
        })

      if (stream) {
        stream
          .pipe(json.parse())
          .pipe(parser)
          .on('data', (d: any, data: any) => {
            all.push(d)
          })
          .on('end', async function() {
            log('\n⚡️ Verifying...')
            const bar = ux.progress.init()
            bar.start(100, 0)
            for (let i = 0; i < all.length; i++) {
              bar.update(100 - all.length / i)
              await ux.wait(50)
            }
            bar.update(100)
            bar.stop()
            log(
              `\n💻 Run ${ux.colors.green('$')} ${ux.colors.italic.dim(
                'ops run ' + op.name,
              )} to test your op.`,
            )
            log(
              `📦 Run ${ux.colors.green('$')} ${ux.colors.italic.dim(
                'ops publish ' + opPath,
              )} to share your op. \n`,
            )
            resolve()
          })
      }
    }
  })
}
export default build
