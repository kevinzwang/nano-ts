import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, RichEmbed } from 'discord.js'

import axios from 'axios';
import * as cheerio from 'cheerio';
import { getVideoDurationInSeconds } from 'get-video-duration'

import { searchChooser } from '../util/anilist';
import { animeSearchQuery, apiURL, animeMusicInfoQuery } from '../constants/anilist';
import { AnimeMusicInfo } from '../interfaces/anilist';

export class AnimeMusicCommand extends Command {
    private readonly EMBED_COLOR = 0x4CCA51
    private readonly TIMEOUT = 60000 // milliseconds

    constructor(client: CommandoClient) {
        super (client, {
            name: 'animemusic',
            group: 'weeb',
            memberName: 'am',
            description: 'Plays a queried anime song.',
            guildOnly: true,
            aliases: [ 'am' ],
            examples: [
                'am bakemonogatari'
            ],
            args: [
                {
                    key: 'anime',
                    prompt: 'please specify the anime that the song is from.',
                    type: 'string'
                }
            ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    async run(msg: CommandMessage, args: { anime : string }): Promise<Message | Message[]> {
        if (!msg.member.voiceChannel) {
            return msg.reply('You need to join a voice channel first!')
        }

        let { respMsg, id } = await searchChooser(animeSearchQuery, args.anime, msg, this.EMBED_COLOR)

        if (id == -1) {
            if (!respMsg) {
                msg.member.voiceChannel.leave()
                return msg.reply('no anime found.')
            }
        } else {
            let anilistResp = await axios.post(apiURL, {
                query: animeMusicInfoQuery,
                variables: {
                    id: id
                }
            })

            let anime = anilistResp.data.data.Media as AnimeMusicInfo

            let year = anime.startDate.year >= 2000 ? anime.startDate.year : Math.floor((anime.startDate.year % 100)/10) + '0s' // they grouped in decades before 2000
            
            let redditResp = await axios.get(`https://www.reddit.com/r/AnimeThemes/wiki/${year}`)

            let $ = cheerio.load(redditResp.data)

            let title = $(`a[href="https://myanimelist.net/anime/${anime.idMal}"]`)
            if (title.length === 0) {
                title = $(`a[href="https://myanimelist.net/anime/${anime.idMal}/"]`)
            }

            if (title.length === 0) {
                return respMsg.edit(`Could not find music for "${anime.title.userPreferred}".`, { embed: null })
            } else {
                let songNames: string[] = []
                let songLinks: string[] = []
                
                title.parent().nextAll('table').first().children('tbody').children('tr').each((_, el) => {
                    let cols = $(el).children()
                    let songName = cols.eq(0).text()

                    if (songName) {
                        let versionless = songName.substring(0, songName.indexOf(' ')) + ' ' + songName.substring(songName.indexOf('"'))
                        if (!songNames.includes(versionless)) {
                            let songLink = cols.eq(1).children('a').attr('href')

                            songNames.push(versionless)
                            songLinks.push(songLink)
                        }
                    }
                })

                let results = ''
                songNames.forEach((name, index) => {
                    results += `${index + 1}. ${name}`
                    
                    if (index < songNames.length - 1) {
                        results += '\n'
                    }
                })

                let embed = new RichEmbed({
                    title: `Songs in "${anime.title.userPreferred}"`,
                    color: this.EMBED_COLOR,
                    description: results,
                    thumbnail: {
                        url: anime.coverImage.large
                    },
                    footer: {
                        text: 'Type a number to select or "c" to cancel.'
                    }
                })

                if (respMsg) {
                    await respMsg.edit({ embed: embed })
                } else {
                    respMsg = await msg.channel.send({ embed: embed }) as Message
                }

                let filter = (m: Message) => {
                    if (!m.author.equals(msg.author)) return false

                    let lower = m.content.toLowerCase()
                    if (lower === 'c') return true

                    let n = Number(m.content)
                    if (isNaN(n)) return false
                    if (n < 1 || n > songNames.length) return false

                    return true
                }

                try {
                    let collection = await msg.channel.awaitMessages(filter, { time: this.TIMEOUT, maxMatches: 1, errors: ['time'] })
                    let selection = collection.first().content

                    collection.first().delete()

                    if (selection === 'c') {
                        respMsg.edit('Search cancelled', { embed: null })
                    } else {
                        let durationStr: string
                        try {
                            let duration = await getVideoDurationInSeconds(songLinks[Number(selection) - 1])
                            let minutes = Math.floor(duration / 60)
                            let seconds = Math.round(duration % 60)

                            durationStr = `${minutes} ${minutes == 1 ? ' minute ' : ' minutes '} ${seconds} ${seconds == 1 ? ' second' : ' seconds'}`
                        } catch (err) {
                            durationStr = 'idk, something went wrong'
                        }
                        
                        respMsg.edit({ embed:  {
                            title: `Playing ${songNames[Number(selection) - 1]}`,
                            color: this.EMBED_COLOR,
                            fields: [
                                {
                                    name: 'Duration',
                                    value: durationStr
                                },
                                {
                                    name: 'Anime',
                                    value: `[${anime.title.userPreferred}](${anime.siteUrl})`
                                },
                                {
                                    name: 'Link',
                                    value: songLinks[Number(selection) - 1]
                                }
                            ],
                            thumbnail: {
                                url: anime.coverImage.large
                            },
                            footer: {
                                text: 'animethemes.moe'
                            }
                        }})

                        let conn = await msg.member.voiceChannel.join()
                        let dispatch = conn.playArbitraryInput(songLinks[Number(selection) - 1])
                        
                        dispatch.once('end', (reason) => {
                            if (reason == 'stream') {
                                msg.member.voiceChannel.leave()
                            }
                        })
                    }
                } catch (err) {
                    console.log(err)
                    await respMsg.edit('Search timed out.', { embed: null })
                }
            }
        }
    }
}