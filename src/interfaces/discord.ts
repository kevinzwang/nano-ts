import { Message, TextChannel } from 'discord.js'
import { CommandMessage } from 'discord.js-commando';

export interface GuildMessage extends Message {
    channel: TextChannel
}

export interface CommandGuildMessage extends CommandMessage {
    channel: TextChannel
}