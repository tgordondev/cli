export interface OclifCommand {
  type: string
  name: string
  message: string
  validate: Function
}
