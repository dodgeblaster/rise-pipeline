# Rise Pipeline

## Intro

Rise Pipeline is a CLI which takes a `pipeline.js` file, and deploys an AWS Code Pipeline in our AWS account. The goal of rise pipeline is to make building pipelines much as simple and make developers productive.

## Install

```ts
npm i -g rise-pipeline
```

## Usage

Deploy

```ts
rise-pipeline deploy
```

## How to make a pipeline

All you need to deploy a pipeline is a
`pipeline.js` file in the folder you
run the deploy command. Inside this file, you will need the
following structure:

```js
module.exports = {
    name: 'nameofmypipeline',
    stages: [
        {
            name: 'NameOfMyStage',
            actions: [action1, action2]
        },
        {
            name: 'NameOfMySecondStage',
            actions: [action1, action2]
        }
    ]
}
```

The above code will deploy a AWSCodePipeline in your AWS
account. Rise Pipeline assumes the credentials on your
computer, which can be found in
`~/.aws/credential`. The CLI will
assume the default credentials set in that file.

Each stage has an array of actions. These actions are JS
objects which are explained in more detail below. A common
strategy is to devide your stages up into something like:
Source, Beta, Gamma, Prod. Another examply might be: Source,
Staging, Prod. Some make a testing stage, others would argue
testing should be done in every stage.

## How do actions work and how do I define them?

There are 5 different types of actions you are able to
define and add to a stages actions array: SOURCE, BUILD,
INVOKE, APPROVE, DEPLOY.

### SOURCE

SOURCE represents the code repository this pipeline will
listen for and use it future actions. Currently, only Github
is supported. Here is an example of a source action:

```js
actions: [
    {
        type: 'SOURCE',
        name: 'nameOfMyAction',
        repo: 'nameOfMyRepo',
        owner: 'nameOfMyGithubUser'
    }
]
```

### BUILD

BUILD is how you run terminal commands. This is great for
building your project, running tests, or even deploying if
you are using a cli to deploy your project. Your terminal
commands need to be located in another yml file, usually
located along side your pipeline.js file in your project,
like `myTerminalCommands.yml`

```js
// pipeline.js
actions: [
    {
        type: 'BUILD',
        name: 'NameOfAction',
        script: '/test.yml',
        env: {
            STAGE: 'staging'
        }
    }
]
```

```yml
# test.yml
version: 0.2
phases:
    install:
        runtime-versions:
            nodejs: 14

    build:
        commands:
            - npm i
            - npm test
```

### INVOKE

INVOKE is an action that will trigger an AWS Lambda function
in your AWS account. This is great if you need extra
flexibility, since you can execute any code you want in a
Lambda.

```js
actions: [
    {
        type: 'INVOKE',
        name: 'nameOfMyAction',
        functionName: 'nameOfMyFunction',
        stage: 'us-east-1'
    }
]
```

### DEPLOY

DEPLOY will deploy a cloudformation template.

```js
actions: [
    {
        type: 'DEPLOY',
        name: 'nameOfMyAction',
        stackName: 'nameofmystack',
        template: 'path/to/my/template.yml',
        parameters: {
            Stage: 'prod'
        }
    }
]
```

### APPROVAL

APPROVAL represents a hard stop in your pipeline where
someone needs to click approve before the pipeline
continues. This is great for pipelines that cannot be CICD
and need human interaction or the approval of an individual
before continuing

```js
actions: [
    {
        type: 'APPROVAL',
        name: 'nameOfMyAction'
    }
]
```
