import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel, DMChannel, GroupDMChannel, RichEmbed } from 'discord.js'
import axios from 'axios'
import { XmlEntities } from 'html-entities'
const entities = new XmlEntities()

import { animeQuickSearchQuery, animeSearchQuery, animeQuery, randomAnimeQuery } from '../constants/anilist';
import { Anime, AnimeSearchPage } from '../interfaces/anilist';

const TurndownService = require('turndown')
const turndownService = new TurndownService()

export class AnimeCommand extends Command {
    private readonly API_URL = 'https://graphql.anilist.co'
    private readonly MAX_DESCRIPTION_LENGTH = 256
    private readonly EMBED_COLOR = 0x44b5f0
    private readonly PER_PAGE = 8
    private readonly TIMEOUT = 60000 // milliseconds

    constructor(client: CommandoClient) {
        super(client, {
            name: 'anime',
            group: 'weeb',
            memberName: 'anime',
            description: 'Gives quick info about the searched anime.',
            aliases: ['a'],
            patterns: [/{(.+)}/], // matches '{foo}'
            examples: [
                'anime kimi na wa',
                'my favorite show of the season is {demon slayer}'
            ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }

    async run(msg: CommandMessage, args: string | string[], fromPattern: boolean): Promise<Message | Message[]> {
        if (fromPattern) { // quick search
            args = (args as string[])[1] // gets the second result which is the not curly brace

            let anime = await this.quickSearch(args)

            if (anime) {
                return this.sendAnime(msg.channel, anime)
            }
        } else {
            args = args as string

            let respMsg: Message
            
            let page = await this.search(args, 1)
            
            // things to check the first time
            if (page.pageInfo.total == 0) { // shows a random anime if none found
                msg.channel.send('No anime found, here\'s a random anime instead.')
                let anime = await this.randomAnime()
                return this.sendAnime(msg.channel, anime)
            } else if (page.pageInfo.total == 1) {
                let anime = await this.getAnime(page.media[0].id)
                return this.sendAnime(msg.channel, anime)
            } else {
                respMsg = await this.sendSearch(msg.channel, page, args) as Message
            }

            while (true) {
                let filter = (m: Message) => {
                    if (!m.author.equals(msg.author)) return false
    
                    let lower = m.content.toLowerCase()
                    if (lower === 'n' || lower === 'c') return true // next and cancel work
    
                    let n = Number(m.content)
                    if (isNaN(n)) return false // if it's not a number
                    if (n <= 0 || n > this.PER_PAGE) return false // if it's not within 1 - 8
                    if (!page.pageInfo.hasNextPage && (n > page.pageInfo.total % this.PER_PAGE && page.pageInfo.total % this.PER_PAGE != 0)) return false // if it's the last page and it's not within bounds
    
                    return true
                }

                try {
                    let collection = await msg.channel.awaitMessages(filter, { time: this.TIMEOUT, maxMatches: 1, errors: ['time'] })
                    let selection = collection.first().content

                    collection.first().delete()

                    if (selection == 'n') {
                        if (page.pageInfo.hasNextPage) {
                            page = await this.search(args, page.pageInfo.currentPage+1)
                            respMsg = await this.sendSearch(msg.channel, page, args, respMsg) as Message    
                        } else {
                            return respMsg.edit('No more pages.', { embed: null})
                        }
                    } else if (selection == 'c') {
                        return respMsg.edit('Search cancelled.', { embed: null})
                    } else {
                        let anime = await this.getAnime(page.media[Number(selection) - 1].id)
                        return this.sendAnime(msg.channel, anime, respMsg)
                    }
                } catch (err) {
                    return respMsg.edit('Search timed out.', { embed: null})
                }

            }
        }
    }

    private sendAnime(channel: TextChannel | DMChannel | GroupDMChannel, anime: Anime, msg?: Message): Promise<Message | Message[]> {
        let description = turndownService.turndown(entities.decode(anime.description)).replace(/\s\s+/g, ' ');
        if (description.length > this.MAX_DESCRIPTION_LENGTH) {
            description = description.substring(0, this.MAX_DESCRIPTION_LENGTH - '...'.length) + '...'
        }

        let format: string
        switch (anime.format) {
            case 'TV_SHORT':
                format = 'TV Short'
                break
            case 'MOVIE':
                format = 'Movie'
                break
            case 'SPECIAL':
                format = 'Special'
                break
            case 'MUSIC':
                format = 'Music'
                break
            default:
                format = anime.format
        }

        let status: string
        if (anime.nextAiringEpisode) {
            if (anime.nextAiringEpisode.episode === 1) {
                status = 'Primieres:'
            } else {
                status = `Ep ${anime.nextAiringEpisode.episode}:`
            }

            // prevCounted used so that things like 4d 0h 2m will be displayed
            let prevCounted = false
            let remainder = anime.nextAiringEpisode.timeUntilAiring

            // days
            if (Math.floor(remainder / 86400) != 0) {
                status += ` ${Math.floor(remainder / 86400)}d`
                remainder %= 86400
                prevCounted = true
            }

            // hours
            if (Math.floor(remainder / 3600) != 0 || prevCounted) {
                status += ` ${Math.floor(remainder / 3600)}h`
                remainder %= 3600
                prevCounted = true
            }

            status += ` ${Math.floor(remainder / 60)}m`
        } else {
            function toTitleCase(str: string): string {
                return str.replace(/\w\S*/g, function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            }
            status = toTitleCase(anime.status.replace(/_/g, ' '))
        }

        let allTimePop = 0
        for (let r of anime.rankings) {
            if (r.allTime) {
                allTimePop = r.rank
                break
            }
        }

        let genres = ''
        for (let i = 0; i < anime.genres.length; i++) {
            genres += `[${anime.genres[i]}](https://anilist.co/search/anime?includedGenres=${encodeURIComponent(anime.genres[i])})`
            if (i < anime.genres.length - 1) {
                genres += '  |  '
            }
        }

        let embed = new RichEmbed({
            url: anime.siteUrl,
            title: anime.title.userPreferred,
            color: this.EMBED_COLOR,
            description: description,
            thumbnail: {
                url: anime.coverImage.large
            },
            fields: [
                {
                    name: 'Format',
                    value: format,
                    inline: true
                },
                {
                    name: 'Status',
                    value: status,
                    inline: true
                },
                {
                    name: 'Score',
                    value: anime.meanScore ? anime.meanScore + '%' : '¯\\_(ツ)_/¯',
                    inline: true
                },
                {
                    name: 'Popularity',
                    value: allTimePop ? '#' + allTimePop : '¯\\_(ツ)_/¯',
                    inline: true
                },
                {
                    name: 'Genres',
                    value: genres ? genres : 'None',
                    inline: true
                }
            ],
            footer: {
                icon_url: 'https://avatars2.githubusercontent.com/u/18018524?s=280&v=4',
                text: 'Fetched from Anilist.co'
            }
        })

        if (msg) {
            return msg.edit({ embed: embed })
        } else {
            return channel.send({ embed: embed })
        }
    }

    private quickSearch(search: string): Promise<Anime> {
        return axios.post(this.API_URL,
            {
                query: animeQuickSearchQuery,
                variables: {
                    search: search
                }
            }
        ).then(resp => {
            return resp.data.data.Media as Anime
        }).catch(() => {
            return null
        })
    }

    private search(search: string, page: number): Promise<AnimeSearchPage> {
        return axios.post(this.API_URL,
            {
                query: animeSearchQuery,
                variables: {
                    perPage: this.PER_PAGE,
                    page: page,
                    search: search
                }
            }
        ).then(resp => {
            return resp.data.data.Page as AnimeSearchPage
        })
    }

    private sendSearch(channel: TextChannel | DMChannel | GroupDMChannel, page: AnimeSearchPage, search: string, msg?: Message): Promise<Message | Message[]> {
        let results = ''
        for (const [index, anime] of page.media.entries()) {
            results += `${index + 1}. [${anime.title.userPreferred}](${anime.siteUrl})`
            if (index < this.PER_PAGE - 1) {
                results += '\n'
            }
        }
        let embed = new RichEmbed({
            title: `Search results for: "${search}" (page ${page.pageInfo.currentPage}/${page.pageInfo.lastPage})`,
            color: this.EMBED_COLOR,
            description: results,
            footer: {
                icon_url: 'https://avatars2.githubusercontent.com/u/18018524?s=280&v=4',
                text: 'Type a number to select, "n" to go to the next page, or "c" to cancel.'
            }
        })

        if (msg) {
            return msg.edit({ embed: embed })
        } else {
            return channel.send({ embed: embed })
        }
    }

    private getAnime(id: number): Promise<Anime> {
        return axios.post(this.API_URL,
            {
                query: animeQuery,
                variables: {
                    id: id
                }
            }
        ).then(resp => {
            return resp.data.data.Media as Anime
        })
    }

    private randomAnime(): Promise<Anime> {
        return axios.post(this.API_URL,
            {
                query: randomAnimeQuery,
                variables: {
                    page: 0
                }
            }
        ).then(resp => {
            return axios.post(this.API_URL,
                {
                    query: randomAnimeQuery,
                    variables: {
                        page: Math.floor(Math.random() * resp.data.data.Page.pageInfo.total)
                    }
                }
            )
        }).then(resp => {
            return resp.data.data.Page.media[0] as Anime
        })
    }
}