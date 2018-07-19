import * as fs from 'fs'
import * as path from 'path'

interface ConfigFile {
    token: string
    ownerID: string
    supportServer?: string
    guilds: {
        global:  {
            prefix: string
        }
        [guild: string]: ServerConfig
    }
}

interface ServerConfig {
    prefix?: string | null
}

var configPath = path.join(__dirname, '../config.json')

function readConfig(): ConfigFile {
    let file = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(file) as ConfigFile
}

function writeConfig(data: string | ConfigFile) {
    if (typeof data !== 'string') {
        data = JSON.stringify(data, null, 4)
    }
    fs.writeFileSync(configPath, data, 'utf8')
}

export function getToken(): string {
    return readConfig().token
}

export function getOwner(): string {
    return readConfig().ownerID
}

export function getPrefix(guild: string): string | null | undefined {
    return readConfig().guilds[guild].prefix
}

export function getSupportServer(): string | undefined {
    return readConfig().supportServer
}

export function setPrefix(guild: string, prefix: string | null) {
    let cfg = readConfig()
    
    if (cfg.guilds[guild]) {
        cfg.guilds[guild].prefix = prefix
    } else {
        cfg.guilds[guild] = {prefix: prefix}
    }

    writeConfig(cfg)
}