import Command, { flags } from '../../base'
import Team from '../../types/Team'
import InvitesResponse from '../../types/Invites'
import OclifCommand from '../../types/OclifCommand'
const { ux } = require('@cto.ai/sdk')

const SENT_SUCCESSFULLY = 'sent successfully!'
const SENT_FAILURE = 'failed to send'

export default class TeamInvite extends Command {
  static description = 'Invite your team members.'

  // Used to specify variable length arguments
  // We want to override this to give better error handling to the user
  static strict = false

  static flags = {
    help: flags.help({ char: 'h' }),
    inviteesInput: flags.string({
      char: 'i',
      description:
        'A comma-separated string of usernames/emails we want to invite. E.g. ("user1, user2@gmail.com, user3@something")',
    }),
  }

  questions: OclifCommand[] = []

  async run(): Promise<void> {
    const {
      flags: { inviteesInput },
      argv,
    } = this.parse(TeamInvite)

    if (argv.length) {
      this.error(
        'team:invite doesn\'t accept any arguments. Please use the -i flag like this: ops team:invite "user1, user2@gmail.com, user3@something"',
      )
    }

    // Gets the active team, indicating which team to invite to
    const activeTeam: Team = await this._getActiveTeamId()

    const invitesPrompt = this._getInvitesPrompt(activeTeam) // Structure the question to ask to the user
    if (!inviteesInput) this.questions.push(invitesPrompt) // Ask the question if no param is given through flag

    let invitees = inviteesInput || '' // Initializes the invitees

    // Sets the response to the invitees question
    if (this.questions.length) {
      const res = await ux.prompt(this.questions)
      invitees = res && res.invitees ? res.invitees : invitees
    }

    const inviteesArray = this._splitInvitees(invitees) // Splits the comma-delimited invitees

    // Invites the users to the team
    await this._inviteUserToTeam(activeTeam, inviteesArray)
      .then(inviteResponses => {
        this._printInviteResponses(inviteResponses)
      })
      .catch(() => {
        this.error(`Failed inviting ${inviteesArray.length} users to team`)
      })
  }

  // Prints the invite responses
  private _printInviteResponses(inviteResponses: InvitesResponse[]) {
    let numSuccess = 0
    inviteResponses.forEach(inviteResponse => {
      this.log('') // Gives and empty line
      // Logs succesful invite
      if (inviteResponse.sentStatus === SENT_SUCCESSFULLY) {
        numSuccess++
        this.log(
          `${ux.colors.green('✔')} ${ux.colors.white(
            `Invite Sent! ${inviteResponse.email}`,
          )}`,
        )
        // Logs unsuccessful invite
      } else {
        this.log(
          `😞 ${ux.colors.white('Invite Failed!')} ${ux.colors.red(
            `❌ ${inviteResponse.email}`,
          )}`,
        )
      }
    })
    // Logs the summary of invites
    this.log(
      `\n ${ux.colors.white(
        `🙌 Invited ${numSuccess} team member${numSuccess > 1 ? 's' : ''}!`,
      )}`,
    )
  }

  // Gets the question to ask for to the user
  private _getInvitesPrompt(teamInfo: Team): OclifCommand {
    return {
      type: 'input',
      name: 'invitees',
      message: `\n${ux.colors.callOutCyan(
        'Invite team members to',
      )} ${ux.colors.reset.blue(teamInfo.name)} ${ux.colors.callOutCyan(
        'and start sharing your Ops',
      )} ${ux.colors.reset.green('→')}\n${ux.colors.white(
        'Enter the emails of the team member that you want to invite. (Comma separated)',
      )}
      \n\n${ux.colors.white('🕐 Invite User')}`,
      validate: this._validate,
    }
  }

  // Validates the input
  private _validate(input: string): string | boolean {
    // TODO Improve this validation
    return !!input
  }

  /**
   * Splits the invitees by either string or space
   * Handles the case of:
   * "username1,username2,username3" => ["username1", "username2", "username3"]
   * "username1, username2, username3" => ["username1", "username2", "username3"]
   * "username1 username2 username3" => ["username1", "username2", "username3"]
   * "username1,username2 username3" => ["username1", "username2", "username3"]
   * ", username1      ,   username2,,,,,,      username3 ,," => ["username1", "username2", "username3"]
   */
  private _splitInvitees(invitees: string): string[] {
    return invitees
      .replace(/ /g, ',') // Replaces all whitespaces with string
      .replace(/,+/g, ',') // Handles the case of nico@cto.ai, nico+1@cto.ai
      .replace(/^,+/g, '') // Handles the case of nico@cto.ai, nico+1@cto.ai
      .replace(/,+$/g, '') // Handles the case of nico@cto.ai, nico+1@cto.ai
      .split(',')
  }

  // Obtains the active team id from the config
  private async _getActiveTeamId(): Promise<Team> {
    const configData = await this.readConfig()
    // const configData = await this.readConfig()

    if (!configData || !configData.team) {
      this.error('Failed in getting active team')
    }

    return configData.team
  }

  // Sends the invite to the team
  private async _inviteUserToTeam(
    desiredTeam: Team,
    userNameOrEmail: string[],
  ): Promise<InvitesResponse[]> {
    const response = await this.client
      .service(`teams/${desiredTeam.id}/invites`)
      .create(
        { UserOrEmail: userNameOrEmail },
        { headers: { Authorization: this.accessToken } },
      )
    if (response && response.data) {
      return response.data
    }
    return []
  }
}
