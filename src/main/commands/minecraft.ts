import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js';
import axios from 'axios'

import * as config from '../../config';
import { ServerInfo } from '../../interfaces/minecraft'

export class MinecraftCommand extends Command {
    readonly onlineColor = 0x00FF00
    readonly offlineColor = 0xFF0000

    constructor(client: CommandoClient) {
        super (client, {
            name: 'minecraft',
            group: 'util',
            memberName: 'minecraft',
            description: 'Pings the Chaos Minecraft server.',
            aliases: [
                'mc',
            ]
        })
    }
    run(msg: CommandMessage): Promise<Message | Message[]> {
        let serverIp = config.getMcServer()
        if (serverIp == null) {
            return msg.channel.send("This bot's owner did not provide it with a Minecraft server IP to ping.")
        }

        return axios.get("https://mcapi.us/server/status?ip=" + serverIp)
            .then((resp) => {
                return resp.data as ServerInfo
            })
            .then((info) => {
                if (info.online) {
                    return msg.channel.send({
                        embed: {
                            title: "Minecraft Server: " + serverIp,
                            color: this.onlineColor,
                            description: info.motd,
                            fields: [
                                {
                                    name: "Players",
                                    value: info.players.now + "/" + info.players.max,
                                    inline: true
                                },
                                {
                                    name: "Server Type",
                                    value: info.server.name,
                                    inline: true
                                }
                            ],
                            footer: {
                                icon_url: "http://purepng.com/public/uploads/large/71502582731v7y8uylzhygvo3zf71tqjtrwkhwdowkysgsdhsq3vr35woaluanwa4zotpkewhamxijlulfxcrilendabjrjtozyfrqwogphaoic.png",
                                text: "Fetched from mcapi.us"
                            }
                        }
                    })
                } else {
                    return msg.channel.send({
                        embed: {
                            title: "Minecraft Server: " + serverIp,
                            color: this.offlineColor,
                            description: "The server is currently offline.",
                            footer: {
                                icon_url: "http://purepng.com/public/uploads/large/71502582731v7y8uylzhygvo3zf71tqjtrwkhwdowkysgsdhsq3vr35woaluanwa4zotpkewhamxijlulfxcrilendabjrjtozyfrqwogphaoic.png",
                                text: "Fetched from mcapi.us"
                            }
                        }
                    })
                }
            })
    }
}