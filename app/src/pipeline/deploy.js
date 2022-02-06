const foundation = require('rise-foundation')
const fs = require('fs')
const codestar = foundation.default.codestar.cf
const cloudformation = foundation.default.cloudformation

const utils = require('riseapp-utils')
const u = utils.default.io.fileSystem
const getStr = require('./getFunctionConfigValues')

const vercelAction = async (config) => {
    let envs = ''
    for (const k of Object.keys(config.env)) {
        const val = await getStr(config.env[k])
        envs = envs + `--env ${k}=${val} `
    }

    const terminal = `version: 0.2
phases:
    install:
        runtime-versions:
            nodejs: 14

    build:
        commands:
            - npm i -g vercel
            - cd ${config.path} && vercel --token=$TOKEN ${envs}${config.prod ? '--prod' : ''} --confirm
    `
    return terminal
}

module.exports.deploy = async function () {
    const def = u.getJsFileFromProject('/pipeline.js')

    let template = {
        Resources: {
            ...codestar.makeGithubConnection(def.name).Resources,
            ...codestar.makeArtifactBucket(def.name).Resources
        },
        Outputs: {}
    }

    let pipelineStages = []
    for (const s of def.stages) {
        let actions = []

        for (const x of s.actions) {
            if (x.type === 'BUILD') {
                const text = fs.readFileSync(process.cwd() + x.script, 'UTF-8')
                const name = (def.name + x.script).replace(/[^a-zA-Z ]/g, '')
                const build = codestar.makeBuildProject({
                    name: name,
                    buildSpec: text,
                    env: {}
                })
                template = {
                    Resources: {
                        ...template.Resources,
                        ...build.Resources
                    },
                    Outputs: {
                        ...template.Outputs,
                        ...build.Outputs
                    }
                }

                actions.push({
                    ...x,
                    env: x.env || {},
                    projectCFName: name,
                    inputArtifact: x.inputArtifact || 'sourceZip',
                    outputArtifact: x.outputArtifact || x.name + 'Zip'
                })
            } else if (x.type === 'VERCEL') {
                const name = (def.name + 'deployVercel').replace(/[^a-zA-Z ]/g, '')
                const build = codestar.makeBuildProject({
                    name: name,
                    buildSpec: await vercelAction({
                        path: x.path,
                        prod: x.prod || false,
                        env: x.env || {}
                    }),
                    env: {
                        TOKEN: x.token
                    }
                })
                template = {
                    Resources: {
                        ...template.Resources,
                        ...build.Resources
                    },
                    Outputs: {
                        ...template.Outputs,
                        ...build.Outputs
                    }
                }

                actions.push({
                    ...x,
                    type: 'BUILD',
                    env: {
                        TOKEN: x.token
                    },
                    projectCFName: name,
                    inputArtifact: x.inputArtifact || 'sourceZip',
                    outputArtifact: x.outputArtifact || x.name + 'Zip'
                })
            } else {
                if (x.type === 'SOURCE') {
                    x.outputArtifact = x.outputArtifact || 'sourceZip'
                } else {
                    x.inputArtifact = x.inputArtifact || 'sourceZip'
                    x.outputArtifact = x.outputArtifact || x.name + 'Zip'
                }
                actions.push(x)
            }
        }

        pipelineStages.push({
            name: s.name,
            actions
        })
    }

    const pipe = codestar.makePipeline({
        pipelineName: def.name,
        stages: pipelineStages
    })

    template = {
        Resources: {
            ...template.Resources,
            ...pipe.Resources
        },
        Outputs: {
            ...template.Outputs,
            ...pipe.Outputs
        }
    }

    await cloudformation.deployStack({
        name: def.name,
        template: JSON.stringify(template)
    })

    let status = {}
    console.log('Deploying pipeline...')
    await cloudformation.getDeployStatus({
        config: {
            stackName: def.name,
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
    console.log('Deployment Complete')
}
