const f = require('rise-foundation')
const cloudformation = f.default.cloudformation

module.exports = async () => {
    let name

    try {
        const config = require(process.cwd() + '/pipeline.js')
        if (!config.name) {
            console.log('pipeline.js file must export a object with a name')
            return
        }
        name = config.name
    } catch (e) {
        if (e.message.includes('Cannot find module')) {
            console.log(
                'You must be in a directory that has a valid pipeline.js file'
            )
            return
        }
        throw new Error(e)
    }
    await cloudformation.removeStack({
        name: name
    })

    let status = {}
    console.log('Removing pipeline...')
    await cloudformation.getRemoveStatus({
        config: {
            stackName: name,
            minRetryInterval: 5000,
            maxRetryInterval: 10000,
            backoffRate: 1.1,
            maxRetries: 200,
            onCheck: (resources) => {
                resources.forEach((item) => {
                    if (!status[item.id]) {
                        status[item.id] = item.status
                        console.log(`${item.id}: ${item.status}`)
                    } else if (item.status !== status[item.id]) {
                        status[item.id] = item.status
                        console.log(`${item.id}: ${item.status}`)
                    }
                })
            }
        }
    })
    console.log('Pipeline is removed.')
}
