export interface ServerInfo {
    status: string
    online: boolean
    motd: string
    error: string
    players: {
        max: number
        now: number
    }
    server: {
        name: string
        protocol: number
    }
    last_online: string
    last_updated: string
    duration: number
}