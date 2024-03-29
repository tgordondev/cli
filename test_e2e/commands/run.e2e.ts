/**
 * @author: JP Lew (jp@cto.ai)
 * @date: Tuesday, 11th June 2019 6:30:38 pm
 * @lastModifiedBy: Prachi Singh (prachi@hackcapital.com)
 * @lastModifiedTime: Monday, 21st October 2019 10:07:14 am
 * @copyright (c) 2019 CTO.ai
 */

import fs from 'fs-extra'
import path from 'path'
import { run, signin, signout } from '../utils/cmd'
import {
  DOWN,
  ENTER,
  Y,
  EXISTING_OP_NAME,
  NEW_FILE,
  EXISTING_WORKFLOW_NAME,
  SPACE,
  NEW_WORKFLOW_NAME,
  NEW_WORKFLOW_DESCRIPTION,
  PUBLIC_TEAM_NAME,
  PUBLIC_COMMAND_NAME,
  GITHUB_ACCESS_TOKEN,
  DEFAULT_TIMEOUT_INTERVAL,
} from '../utils/constants'
import { WORKFLOW } from '~/constants/opConfig'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 5

beforeEach(async () => {
  await signin()
})

afterEach(async () => {
  await signout()
})

test('it should run a published op by passing name as argument', async () => {
  const result = await run(['run', EXISTING_OP_NAME], [Y, ENTER])
  expect(result).toContain(`Running ${EXISTING_OP_NAME}...`)

  const newFile = path.join(process.cwd(), NEW_FILE)
  const newFileExists = fs.existsSync(newFile)
  expect(newFileExists).toBeTruthy()

  if (newFileExists) {
    fs.unlinkSync(newFile)
  }
})

test('it should run a published workflow by passing name as argument', async () => {
  const result = await run(['run', EXISTING_WORKFLOW_NAME], [Y, ENTER])
  expect(result).toContain('Running echo hello 1')
  expect(result).toContain('Running echo hello 2')
  expect(result).toContain('Running echo hello 3')
  expect(result).toContain(
    `Workflow ${EXISTING_WORKFLOW_NAME} completed successfully.`,
  )
})

test('it should run a local op by passing path as argument', async () => {
  const pathToExistingOp = path.join(
    __dirname,
    '../sample_ops',
    EXISTING_OP_NAME,
  )
  const result = await run(
    ['run', pathToExistingOp],
    [ENTER, ENTER, 'write', ENTER],
  )
  expect(result).toContain(`Running ${EXISTING_OP_NAME}...`)
  const newFile = path.join(process.cwd(), NEW_FILE)
  const newFileExists = fs.existsSync(newFile)
  expect(newFileExists).toBeTruthy()

  if (newFileExists) {
    fs.unlinkSync(newFile)
  }
})

test('it should run a local workflow by passing path as argument', async () => {
  const pathToExistingWorkflow = path.join(
    __dirname,
    '../sample_ops',
    EXISTING_WORKFLOW_NAME,
  )

  const result = await run(
    ['run', pathToExistingWorkflow],
    [DOWN, ENTER, Y, ENTER],
  )
  expect(result).toContain('Running echo hello 1')
  expect(result).toContain('Running echo hello 2')
  expect(result).toContain('Running echo hello 3')
  expect(result).toContain(
    `Workflow ${EXISTING_WORKFLOW_NAME} completed successfully.`,
  )
})

test('it should run a public command by exact match', async () => {
  const result = await run(
    ['run', `@${PUBLIC_TEAM_NAME}/${PUBLIC_COMMAND_NAME}`],
    [ENTER, GITHUB_ACCESS_TOKEN, ENTER],
    2000,
  )
  expect(result).toContain(`Running ${PUBLIC_COMMAND_NAME}`)
})
