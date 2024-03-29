import fs from 'fs-extra'
import * as yaml from 'yaml'
import { run, signin, cleanup, signout } from '../utils/cmd'
import {
  ENTER,
  NEW_COMMAND_NAME,
  NEW_COMMAND_DESCRIPTION,
  NEW_COMMAND_VERSION,
  DEFAULT_TIMEOUT_INTERVAL,
} from '../utils/constants'
jasmine.DEFAULT_TIMEOUT_INTERVAL = DEFAULT_TIMEOUT_INTERVAL

const pathToOp = `./${NEW_COMMAND_NAME}`

beforeEach(async () => {
  await signin()
  await run(
    ['init'],
    [ENTER, NEW_COMMAND_NAME, ENTER, NEW_COMMAND_DESCRIPTION, ENTER, ENTER],
  )
})

afterEach(async () => {
  await signout()
  if (fs.existsSync(pathToOp)) fs.removeSync(pathToOp)
})

afterAll(async () => {
  await cleanup()
})

test('it should use default version if none is provided in the ops.yml', async () => {
  let opsYamlDocument = yaml.parseDocument(
    fs.readFileSync(`${pathToOp}/ops.yml`, 'utf8'),
  )
  opsYamlDocument
    // @ts-ignore
    .getIn(['commands', 0])
    .set('name', NEW_COMMAND_NAME)
  fs.writeFileSync(`${pathToOp}/ops.yml`, opsYamlDocument)
  const buildRes = await run(['build', NEW_COMMAND_NAME])
  expect(buildRes.toLowerCase()).toContain(
    'it looks like your ops.yml is a little out of date. it does not have a version, we are setting the default version to 0.1.0. learn more here (https://cto.ai/docs/developing-ops/configuring-ops).',
  )
  expect(buildRes.toLowerCase()).toContain(
    `building: ${NEW_COMMAND_NAME}:${NEW_COMMAND_VERSION}`.toLowerCase(),
  )
  expect(buildRes.toLowerCase()).toContain('successfully built')
})

test('it should error if the version is an invalid format', async () => {
  let opsYamlDocument = yaml.parseDocument(
    fs.readFileSync(`${pathToOp}/ops.yml`, 'utf8'),
  )
  opsYamlDocument
    // @ts-ignore
    .getIn(['commands', 0])
    .set('name', `${NEW_COMMAND_NAME}:.badVersion`)
  fs.writeFileSync(`${pathToOp}/ops.yml`, opsYamlDocument)
  const buildRes = await run(['build', NEW_COMMAND_NAME])
  expect(buildRes.toLowerCase()).toContain(
    '❗ Sorry, version is required and can only contain letters, digits, underscores, \n    periods and dashes and must start and end with a letter or a digit'.toLowerCase(),
  )
})

test('it should error if required fields are missing', async () => {
  let opsYamlDocument = yaml.parseDocument(
    fs.readFileSync(`${pathToOp}/ops.yml`, 'utf8'),
  )
  opsYamlDocument
    // @ts-ignore
    .getIn(['commands', 0])
    .delete('public')
  fs.writeFileSync(`${pathToOp}/ops.yml`, opsYamlDocument)
  const buildRes = await run(['build', NEW_COMMAND_NAME])
  expect(buildRes.toLowerCase()).toContain(
    '❗ Sorry, we have difficulty parsing your ops.yml. Your ops.yml file is missing the public field, please add `public:false` to publish your op as private'.toLowerCase(),
  )
})
