const { Command, flags } = require('@oclif/command')
const { deploy } = require('../pipeline/deploy')

class DeployCommand extends Command {
    async run() {
        const { flags } = this.parse(DeployCommand)
        deploy()
    }
}

DeployCommand.description = `Describe the command here
...
Extra documentation goes here
`

DeployCommand.flags = {
    name: flags.string({ char: 'n', description: 'name to print' })
}

module.exports = DeployCommand
