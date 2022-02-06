const { Command, flags } = require('@oclif/command')
const { remove } = require('../pipeline/remove')

class RemoveCommand extends Command {
    async run() {
        const { flags } = this.parse(RemoveCommand)
        const name = flags.name || 'world'
        remove()
    }
}

RemoveCommand.description = `Describe the command here
...
Extra documentation goes here
`

RemoveCommand.flags = {
    name: flags.string({ char: 'n', description: 'name to print' })
}

module.exports = RemoveCommand
