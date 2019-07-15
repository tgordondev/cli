export interface OpsYml {
  version: string
  ops: Op[]
  workflows: Workflow[]
}

export interface Op extends BaseFields {
  // OPS.YML
  run: string
  bind: string[]
  network?: string
  src: string[]
  mountCwd: boolean
  mountHome: boolean
  // RUN CMD
  image: string | void
  isPublic?: boolean
}

export interface Workflow extends BaseFields {
  steps: string[]
}

interface BaseFields {
  name: string
  description: string
  env: string[]
  runId: string
  opsHome: string
  configDir: string
  stateDir: string
  teamID?: string
  help: {
    usage: string
    arguments: { [key: string]: string }
    options: { [key: string]: string }
  }
  // API
  id: string
  createdAt: string
  updatedAt: string
}
