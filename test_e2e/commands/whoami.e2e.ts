/**
 * @author: JP Lew (jp@cto.ai)
 * @date: Tuesday, 11th June 2019 6:30:38 pm
 * @lastModifiedBy: JP Lew (jp@cto.ai)
 * @lastModifiedTime: Wednesday, 11th September 2019 4:28:56 pm
 * @copyright (c) 2019 CTO.ai
 */

import { run, signin, sleep } from '../utils/cmd'
import { EXISTING_USER_NAME, EXISTING_USER_EMAIL } from '../utils/constants'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 3

beforeEach(async () => {
  try {
    await run(['account:signout'])
  } catch (err) {
    throw err
  }
})

afterAll(async () => {
  // avoid jest open handle error
  await sleep(500)
})

test('it should signin, whoami', async () => {
  console.log('it should signin, whoami')
  await signin()

  console.log(`ops whoami`)

  const result = await run(['whoami'])

  expect(result).toContain(`Email: ${EXISTING_USER_EMAIL}`)
  expect(result).toContain(`Username: ${EXISTING_USER_NAME}`)
  expect(result).toContain(`Team Name: ${EXISTING_USER_NAME}`)
})