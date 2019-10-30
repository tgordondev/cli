/**
 * @author: JP Lew (jp@cto.ai)
 * @date: Friday, 24th May 2019 1:41:52 pm
 * @lastModifiedBy: Prachi Singh (prachi@hackcapital.com)
 * @lastModifiedTime: Friday, 25th October 2019 10:44:44 am
 * @copyright (c) 2019 CTO.ai
 */

import fs from 'fs-extra'
import * as yaml from 'yaml'
import * as path from 'path'
import { run, signin, sleep, cleanup } from '../utils/cmd'
import {
  ENTER,
  NEW_COMMAND_DESCRIPTION,
  NEW_COMMAND_NAME,
  SPACE,
  DOWN,
  NEW_WORKFLOW_NAME,
  NEW_WORKFLOW_DESCRIPTION,
  UP,
  Y,
} from '../utils/constants'
import { COMMAND, WORKFLOW } from '~/constants/opConfig'

// give the suite max 5 minutes to complete
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 5

beforeEach(async () => {
  await run(['account:signout'])
})

afterAll(async () => {
  // avoid jest open handle error
  await cleanup()
  await sleep(500)
})

test('it should init a command, build, publish, list, remove', async () => {
  await signin()
  await sleep(500)

  console.log('ops init a command')
  const initRes = await run(
    ['init'],
    [SPACE, ENTER, NEW_COMMAND_NAME, ENTER, NEW_COMMAND_DESCRIPTION, ENTER],
  )
  expect(initRes.toLowerCase()).toContain('success!')
  expect(initRes.toLowerCase()).toContain(
    `to test your ${COMMAND} run: $ ops run ${NEW_COMMAND_NAME}`,
  )

  await sleep(500)

  console.log(`ops build ${NEW_COMMAND_NAME}`)
  const buildRes = await run(['build', NEW_COMMAND_NAME])
  expect(buildRes.toLowerCase()).toContain('successfully built')

  await sleep(500)

  console.log(`ops publish ${NEW_COMMAND_NAME}`)
  const publishRes = await run(['publish', NEW_COMMAND_NAME], [ENTER])
  expect(publishRes.toLowerCase()).toContain('preparing:')
  expect(publishRes).toContain('has been published!')
  await sleep(1000)

  console.log('ops list')
  // Going 'two downs' because there are two ops in sample ops directory already published by the existing_user team
  // The command with name NEW_COMMAND_NAME is the third op in the list
  const listRes = await run(['list'], [DOWN, DOWN, ENTER])
  await sleep(500)

  expect(listRes).toContain(NEW_COMMAND_NAME)
  await sleep(500)

  console.log(`ops remove ${NEW_COMMAND_NAME}`)
  // ENTER, ENTER doesn't work for some reason
  const removeRes = await run(
    ['remove', NEW_COMMAND_NAME],
    [DOWN, UP, Y, ENTER, ENTER],
  )

  const regexPattern = `${NEW_COMMAND_NAME}:[a-z0-9-]+ has been removed from the registry!`
  const regexObj = new RegExp(regexPattern, 'g')
  expect(removeRes).toMatch(regexObj)
  await sleep(500)

  const pathToOp = `./${NEW_COMMAND_NAME}`

  if (fs.existsSync(pathToOp)) {
    fs.removeSync(pathToOp)
    console.log(pathToOp, ' directory deleted successfully.')
  }
})

test('it should init a workflow, publish, list, remove', async () => {
  await signin()
  await sleep(500)

  console.log('ops init a workflow')
  const initRes = await run(
    ['init'],
    [
      DOWN,
      SPACE,
      ENTER,
      NEW_WORKFLOW_NAME,
      ENTER,
      NEW_WORKFLOW_DESCRIPTION,
      ENTER,
    ],
  )
  expect(initRes.toLowerCase()).toContain('success!')
  expect(initRes).toContain(`🚀 To test your ${WORKFLOW} run:`)
  expect(initRes).toContain(
    `cd ${NEW_WORKFLOW_NAME} && npm install && ops run .`,
  )

  await sleep(500)

  console.log(`ops publish ${NEW_WORKFLOW_NAME}`)
  const publishRes = await run(['publish', NEW_WORKFLOW_NAME], [DOWN, ENTER])
  expect(publishRes).toContain(`${NEW_WORKFLOW_NAME} has been published!`)
  await sleep(1000)

  console.log('ops list')
  const listRes = await run(['list'], [ENTER])
  expect(listRes).toContain(NEW_WORKFLOW_NAME)
  await sleep(500)

  console.log(`ops remove ${NEW_WORKFLOW_NAME}`)
  const removeRes = await run(
    ['remove', NEW_WORKFLOW_NAME],
    [DOWN, Y, ENTER, ENTER],
  )

  const regexPattern = `${NEW_WORKFLOW_NAME}:[a-z0-9-]+ has been removed from the registry!`
  const regexObj = new RegExp(regexPattern, 'g')
  expect(removeRes).toMatch(regexObj)
  await sleep(500)

  const pathToWorkflow = `./${NEW_WORKFLOW_NAME}`

  if (fs.existsSync(pathToWorkflow)) {
    fs.removeSync(pathToWorkflow)
    console.log(pathToWorkflow, ' directory deleted successfully.')
  }
})

test('it should not delete a command if it is being used in a remote workflow', async () => {
  await signin()
  await sleep(500)

  console.log('ops init a command')
  const initRes = await run(
    ['init'],
    [SPACE, ENTER, NEW_COMMAND_NAME, ENTER, NEW_COMMAND_DESCRIPTION, ENTER],
  )
  expect(initRes.toLowerCase()).toContain('success!')
  expect(initRes.toLowerCase()).toContain(
    `to test your ${COMMAND} run: $ ops run ${NEW_COMMAND_NAME}`,
  )

  await sleep(500)

  console.log(`ops build ${NEW_COMMAND_NAME}`)
  const buildRes = await run(['build', NEW_COMMAND_NAME])
  expect(buildRes.toLowerCase()).toContain('successfully built')

  await sleep(500)

  console.log(`ops publish ${NEW_COMMAND_NAME}`)
  const publishRes = await run(['publish', NEW_COMMAND_NAME], [ENTER])
  expect(publishRes.toLowerCase()).toContain('preparing:')
  expect(publishRes).toContain('has been published!')

  await sleep(500)

  console.log('ops init a workflow')
  const initWfRes = await run(
    ['init'],
    [
      DOWN,
      SPACE,
      ENTER,
      NEW_WORKFLOW_NAME,
      ENTER,
      NEW_WORKFLOW_DESCRIPTION,
      ENTER,
    ],
  )
  expect(initWfRes.toLowerCase()).toContain('success!')
  expect(initWfRes).toContain(`🚀 To test your ${WORKFLOW} run:`)
  expect(initWfRes).toContain(
    `cd ${NEW_WORKFLOW_NAME} && npm install && ops run .`,
  )

  console.log('modify ops.yml')
  const destDir = `${path.resolve(process.cwd())}/${NEW_WORKFLOW_NAME}`
  const doc = yaml.parseDocument(fs.readFileSync(`${destDir}/ops.yml`, 'utf-8'))
  doc
    // @ts-ignore
    .getIn(['workflows', 0])
    .setIn(['steps', 1], `ops run ${NEW_COMMAND_NAME}`)
  // @ts-ignore
  doc.getIn(['workflows', 0]).set('remote', true)
  fs.writeFileSync(`${destDir}/ops.yml`, doc.toString())

  await sleep(200)

  console.log(`ops publish ${NEW_WORKFLOW_NAME}`)
  const publishWfRes = await run(['publish', NEW_WORKFLOW_NAME], [DOWN, ENTER])
  expect(publishWfRes).toContain(`${NEW_WORKFLOW_NAME} has been published!`)

  await sleep(500)

  console.log(`ops remove ${NEW_COMMAND_NAME}`)

  const removeRes = await run(
    ['remove', NEW_COMMAND_NAME],
    [DOWN, UP, Y, ENTER, ENTER],
  )
  expect(removeRes).toContain('❗ Sorry, we cannot delete the op.')
  expect(removeRes).toContain(
    'Please verify that it is not being used in some other op.',
  )

  // remove command and workflow created above
  await run(['remove', NEW_WORKFLOW_NAME], [DOWN, UP, Y, ENTER, ENTER])
  await run(['remove', NEW_COMMAND_NAME], [DOWN, UP, Y, ENTER, ENTER])

  // cleanup directories
  const pathToOp = `./${NEW_COMMAND_NAME}`

  if (fs.existsSync(pathToOp)) {
    fs.removeSync(pathToOp)
    console.log(pathToOp, ' directory deleted successfully.')
  }

  const pathToWorkflow = `./${NEW_WORKFLOW_NAME}`

  if (fs.existsSync(pathToWorkflow)) {
    fs.removeSync(pathToWorkflow)
    console.log(pathToWorkflow, ' directory deleted successfully.')
  }
})
