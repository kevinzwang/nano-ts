import {TextChannel, GroupDMChannel} from 'discord.js'

export interface SpoilerMsg {
    message: string
    channel: string
}

export interface ProcessEvent {
    type: 'SPOILER' | 'EXIT'
    data?: SpoilerMsg
}