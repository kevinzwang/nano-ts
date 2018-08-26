import { Message, TextChannel } from 'discord.js'
import { CommandMessage } from 'discord.js-commando';

export interface GuildMessage extends Message {
    channel: TextChannel
}

export interface CommandGuildMessage extends CommandMessage {
    channel: TextChannel
}

export interface RawEvent {
    t: string
    s: number
    op: number
    d: {
        user_id: string
        message_id: string
        emoji: {
            name: string
            id: any
            animated: boolean
        }
        channel_id: string
    }
}