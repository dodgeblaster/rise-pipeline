module.exports = {
    name: 'rise-pipeline-pipeline',
    stages: [
        {
            name: 'Source',
            actions: [
                {
                    type: 'SOURCE',
                    name: 'GithubRepo',
                    repo: 'rise-pipeline',
                    owner: 'dodgeblaster'
                }
            ]
        },
        {
            name: 'Prod',
            actions: [
                // {
                //     type: 'BUILD',
                //     name: 'Test',
                //     script: '/test.yml'
                // },
                {
                    type: 'BUILD',
                    name: 'PublishToNpm',
                    script: '/publish.yml',
                    env: {
                        NPM_TOKEN: '@secret.NPM_KEY'
                    }
                },
                {
                    type: 'VERCEL',
                    name: 'DeployDocs',
                    prod: true,
                    path: './docs',
                    token: '@secret.VERCEL_TOKEN'
                }
            ]
        }
    ]
}
