import {TextChannel, GroupDMChannel} from 'discord.js'

export interface SpoilerMsg {
    message: string
    channel: string
}

export interface InviteResponse {
    invite: string
}

export interface ProcessEvent {
    type: 'SPOILER' | 'EXIT' | 'INVITE_REQUEST' | 'INVITE_RESPONSE'
    data?: SpoilerMsg | InviteResponse
}