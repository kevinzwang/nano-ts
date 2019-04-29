import * as fs from 'fs'
import * as path from 'path'

interface ConfigFile {
    token: string
    ownerId: string
    supportServer?: string
    github?: string
    tbaApiKey?: string
    minecraftServerIp?: string
    game?: string
    prefix: string    
}

var configPath = path.join(__dirname, '../config.json')

function readConfig(): ConfigFile {
    let file = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(file) as ConfigFile
}

export function getBotToken(): string {
    return readConfig().token
}

export function getOwner(): string {
    return readConfig().ownerId
}

export function getPrefix(): string  {
    return readConfig().prefix
}

export function getSupportServer(): string | undefined {
    return readConfig().supportServer
}

export function getGithub(): string | undefined {
    return readConfig().github
}

export function getTbaApiKey(): string | undefined {
    return readConfig().tbaApiKey
}

export function getMcServer(): string | undefined {
    return readConfig().minecraftServerIp
}

export function getGame(): string | undefined {
    return readConfig().game
}