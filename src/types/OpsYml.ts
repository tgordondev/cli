import {
  COMMAND_TYPE,
  WORKFLOW_TYPE,
  GLUECODE_TYPE,
} from '../constants/opConfig'

export interface OpsYml {
  version: string
  ops: Op[]
  workflows: Workflow[]
}

export interface Op extends BaseFields {
  type: COMMAND_TYPE | GLUECODE_TYPE
  // OPS.YML
  run: string
  bind: string[]
  network?: string
  src: string[]
  mountCwd: boolean
  mountHome: boolean
  port: string[]
  // RUN CMD
  image: string | void
}

export interface Workflow extends BaseFields {
  type: WORKFLOW_TYPE
  remote: boolean
  steps: string[]
  local?: boolean
}

interface BaseFields {
  name: string
  description: string
  publishDescription?: string
  env: string[]
  runId: string
  opsHome: string
  configDir: string
  stateDir: string
  teamID?: string
  teamName: string
  help: {
    usage: string
    arguments: { [key: string]: string }
    options: { [key: string]: string }
  }
  isPublic: boolean
  isPublished?: boolean
  // API
  id: string
  createdAt: string
  updatedAt: string
}
