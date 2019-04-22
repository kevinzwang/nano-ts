import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import axios from 'axios'

import * as config from '../config';
import { Team, Award, Event, EventStatus } from '../interfaces/tba';
import { blueBanners } from '../constants/tba';

export class TeamCommand extends Command {
    readonly embedColor = 0x3f51b5
    readonly currentEventColor = 0x4caf50
    readonly futureEventColor = 0xf89808

    constructor(client: CommandoClient) {
        super (client, {
            name: 'team',
            group: 'frc',
            memberName: 'team',
            description: 'Gives info about an FRC Team.',
            details: 'the first argument is the team number, and the second optional argument is the year',
            argsType: 'multiple',
            aliases: [
                'frc',
                'tba'
            ],
            examples: [
                'team 199',
                'team 199 2018'
            ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    async run(msg: CommandMessage, args: string[]): Promise<Message | Message[]> {
        if (config.getTbaApiKey() == null) {
            return msg.channel.send("This bot's owner did not setup an API key for TheBlueAlliance.")
        }
        try {
            if (args.length < 1 || args.length > 2) {
                return msg.reply('this command takes between 1 and 2 arguments. See the help page for details.')
            }
            if (args.length == 1) {
                let number = this.toPosInt(args[0])
                if (isNaN(number)) {
                    return msg.reply('arguments must be positive integers. See the help page for details.')
                }

                let teamResp = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${number}?X-TBA-Auth-Key=${config.getTbaApiKey()}`)
                let teamData = teamResp.data as Team
                if (teamData.Errors) {
                    return msg.reply(`could not find team ${number}.`)
                }

                let latestHomeChamp: number = 0
                let latestHomeChampLocation: string = 'none'

                if (teamData.home_championship) {
                    for (let year in teamData.home_championship) {
                        let y = parseInt(year)
                        if (y > latestHomeChamp) {
                            latestHomeChamp = y
                            latestHomeChampLocation = teamData.home_championship[year]
                        }
                    }
                }

                return msg.channel.send({
                    embed: {
                        title: `Team ${teamData.team_number}: ${teamData.nickname}`,
                        url: `https://www.thebluealliance.com/team/${number}`,
                        color: this.embedColor,
                        thumbnail: {
                            url: `https://frcavatars.herokuapp.com/get_image?team=${number}`
                        },
                        fields: [
                            {
                                name: 'Location',
                                value: teamData.city + ', ' + teamData.state_prov + ', ' + teamData.country,
                                inline: true
                            },
                            {
                                name: 'Rookie Year',
                                value: '' + teamData.rookie_year,
                                inline: true
                            },
                            {
                                name: 'Home Championship',
                                value: latestHomeChampLocation,
                                inline: true
                            },
                            {
                                name: 'Website',
                                value: teamData.website ? teamData.website : 'none'
                            }
                        ],
                        footer: {
                            icon_url: 'https://www.thebluealliance.com/images/logo_circle_512.png',
                            text: 'Fetched from TBA'
                        }
                    }
                })
            } else {
                let number = this.toPosInt(args[0])
                let year = this.toPosInt(args[1])
                if (isNaN(number) || isNaN(year)) {
                    return msg.reply('arguments must be positive integers. See the help page for details.')
                }

                let eventsResp = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${number}/events/${year}?X-TBA-Auth-Key=${config.getTbaApiKey()}`)
                let eventsData = eventsResp.data as Event[]
                let awardsResp = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${number}/awards/${year}?X-TBA-Auth-Key=${config.getTbaApiKey()}`)
                let awardsData = awardsResp.data as Award[]
                
                if ((<any>eventsData).Errors || (<any>awardsData).Errors) {
                    return msg.reply(`could not get ${year} info on team ${number}.`)
                }

                let blueBannerCount = 0
                for (let a of awardsData) {
                    if (blueBanners.indexOf(a.award_type) != -1) {
                        blueBannerCount++
                    }
                }

                let eventList:any[] = []
                for (let e of eventsData) {
                    let currEvent = e.name
                    if (Date.now() < Date.parse(e.end_date)) {
                        if (Date.now() > Date.parse(e.start_date)) {
                            currEvent += ' [CURRENT]'
                        } else {
                            currEvent += ' [UPCOMING]'
                        }
                    }

                    let eventInfo = ``
                    let statusResp = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${number}/event/${e.key}/status?X-TBA-Auth-Key=${config.getTbaApiKey()}`)
                    let status = statusResp.data as EventStatus

                    if (status && !status.Errors) {
                        if (status.qual && status.qual.ranking && status.qual.ranking.record) {
                            eventInfo += `**W-L-T:** ${status.qual.ranking.record.wins}-${status.qual.ranking.record.losses}-${status.qual.ranking.record.ties}\n`
                            eventInfo += `**Ranking:** ${status.qual.ranking.rank}/${status.qual.num_teams}\n`
                        }
                        
                        let eventAwards:Award[] = []
                        for (let a of awardsData) {
                            if (a.event_key == e.key) {
                                eventAwards.push(a)
                            }
                        }
                        if (eventAwards.length) {
                            eventInfo += '**Awards:**\n'
                            for (let ea of eventAwards) {
                                eventInfo += `- ${ea.name}\n`
                            }
                        }
                    }

                    eventInfo += `[more info](https://www.thebluealliance.com/event/${e.key})`

                    eventList.push({
                        name: currEvent,
                        value: eventInfo ? eventInfo : 'no data available'
                    })
                }
                
                return await msg.channel.send({
                    embed: {
                        title: `Team ${number} - ${year} Season`,
                        url: `https://www.thebluealliance.com/team/${number}/${year}`,
                        color: this.embedColor,
                        thumbnail: {
                            url: `https://frcavatars.herokuapp.com/get_image?team=${number}`
                        },
                        description: `In ${year}, team ${number} won ${awardsData.length > 0 ? awardsData.length : 'no'} total awards and ${blueBannerCount > 0 ? blueBannerCount : 'no'} blue banners.`,
                        fields: eventList,
                        footer: {
                            icon_url: 'https://www.thebluealliance.com/images/logo_circle_512.png',
                            text: 'Fetched from TBA'
                        }
                    }
                })
            }
        } catch (err) {
            return msg.reply('could not find your query. Please try again.')
        }
    }

    toPosInt (s: string): number {
        let n = Number(s)
        return (n != NaN && n > 0 && n == Math.floor(n)) ? n : NaN
    }
}