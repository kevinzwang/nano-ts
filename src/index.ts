import * as cp from 'child_process'
import * as path from 'path'

import { ProcessEvent } from './interfaces/process'

const mainPath = path.join(__dirname, 'main/index.js')
const helperPath = path.join(__dirname, 'helper/index.js')

const main = cp.fork(mainPath)
const helper = cp.fork(helperPath)

main.on('message', (msg: ProcessEvent) => {
    if (msg.type === 'SPOILER') {
        helper.send(msg)
    }
})

main.on('exit', () => {
    let msg: ProcessEvent = {
        type: 'EXIT'
    }
    helper.send(msg)
})