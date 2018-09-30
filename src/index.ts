import * as cp from 'child_process'
import * as path from 'path'

import { ProcessEvent } from './interfaces/process'

const mainPath = path.join(__dirname, 'main/index.js')
const helperPath = path.join(__dirname, 'helper/index.js')

const main = cp.fork(mainPath)
const helper = cp.fork(helperPath)

main.on('message', (msg: ProcessEvent) => {
    if (msg.type === 'SPOILER' || msg.type === 'INVITE_REQUEST' || msg.type === 'ID_REQUEST') {
        helper.send(msg)
    }
})

helper.on('message', (msg: ProcessEvent) => {
    if (msg.type === 'INVITE_RESPONSE' || msg.type === 'ID_RESPONSE') {
        main.send(msg)
    }
})

main.on('exit', () => {
    let msg: ProcessEvent = {
        type: 'EXIT'
    }
    helper.send(msg)
})