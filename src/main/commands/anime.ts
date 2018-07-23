import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel, DMChannel, GroupDMChannel } from 'discord.js';
import axios from 'axios'
import { XmlEntities } from 'html-entities'
const entities = new XmlEntities()

const TurndownService = require('turndown')
const turndownService = new TurndownService()

import { searchQuery, animeQuery } from '../../constants/anime'
import { SearchPage, Anime } from '../../interfaces/anime'

export class AnimeCommand extends Command {
    readonly perPage: number = 8
    readonly embedColor: number = 0x44b5f0
    readonly maxDescLen: number = 256

    constructor(client: CommandoClient) {
        super(client, {
            name: 'anime',
            group: 'weeb',
            memberName: 'anime',
            description: 'Gives quick info about the searched anime.',
            aliases: ['a'],
            examples: ['anime kimi na wa'],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    async run(msg: CommandMessage, args: string): Promise<Message | Message[]> {
        let pageCount = 1
        let prevSearch: Message | undefined

        while (true) {
            let page = await this.searchAnime(args, pageCount)
            if (page.pageInfo.total == 0) {
                return msg.channel.send('Here I am, brain the size of a planet and they ask me to search for anime that doesn\'t exist.')
            } else if (page.pageInfo.total == 1) {
                return this.sendAnime(msg.channel, page.media[0].id)
            } else if (page.pageInfo.currentPage > page.pageInfo.lastPage) {
                (<Message>prevSearch).delete()
                return msg.reply('No more pages.')
            }

            if (prevSearch != undefined) {
                prevSearch.delete()
            }
            prevSearch = await this.sendSearch(msg.channel, page, args) as Message

            let filter = (m: Message) => {
                if (!m.author.equals(msg.author)) return false

                let lower = m.content.toLowerCase()
                if (lower === 'n' || lower === 'c') return true // next and cancel work

                let n = Number(m.content)
                if (isNaN(n)) return false // if it's not a number
                if (n <= 0 || n > this.perPage) return false // if it's not within 1 - 8
                if (!page.pageInfo.hasNextPage && (n > page.pageInfo.total % this.perPage && page.pageInfo.total % this.perPage != 0)) return false // if it's the last page and it's not within bounds

                return true
            }

            try {
                let chosenColl = await msg.channel.awaitMessages(filter, { time: 60000, maxMatches: 1, errors: ['time'] })
                let chosen = chosenColl.first().content
                chosenColl.first().delete().catch(() => { })
                if (chosen === 'n') {
                    pageCount++
                    continue
                } else if (chosen === 'c') {
                    prevSearch.delete()
                    return msg.reply('Search cancelled.')
                }

                prevSearch.delete()
                let chosenId = page.media[Number(chosen) - 1].id
                return this.sendAnime(msg.channel, chosenId)
            } catch (err) {
                return msg.reply(`Took too long to choose for query "${args}"`)
            }
        }
    }

    private searchAnime(search: string, page: number): Promise<SearchPage> {
        return axios.post('https://graphql.anilist.co',
            {
                query: searchQuery,
                variables: {
                    perPage: this.perPage,
                    page: page,
                    search: search
                }
            }
        ).then(resp => {
            return resp.data.data.Page as SearchPage
        })
    }

    private sendSearch(channel: TextChannel | DMChannel | GroupDMChannel, page: SearchPage, search: string): Promise<Message | Message[]> {
        let results = ''
        for (const [index, anime] of page.media.entries()) {
            results += `${index + 1}. [${anime.title.userPreferred}](${anime.siteUrl})`
            if (index < this.perPage - 1) {
                results += '\n'
            }
        }
        return channel.send({
            embed: {
                title: `Search results for: "${search}" (page ${page.pageInfo.currentPage}/${page.pageInfo.lastPage})`,
                color: this.embedColor,
                description: results,
                footer: {
                    icon_url: 'https://avatars2.githubusercontent.com/u/18018524?s=280&v=4',
                    text: 'Type a number to select, "n" to go to the next page, or "c" to cancel.'
                }
            }
        })
    }

    private sendAnime(channel: TextChannel | DMChannel | GroupDMChannel, id: number): Promise<Message | Message[]> {
        return this.queryAnime(id).then(a => {
            let description: string = turndownService.turndown(entities.decode(a.description)).replace(/\s\s+/g, ' ');
            if (description.length > this.maxDescLen) {
                description = description.substring(0, this.maxDescLen - 3) + '...'
            }

            let format: string
            switch (a.format) {
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
                    format = a.format
            }

            let status: string
            if (a.nextAiringEpisode) {
                if (a.nextAiringEpisode.episode === 1) {
                    status = 'Primieres:'
                } else {
                    status = `Ep ${a.nextAiringEpisode.episode}:`
                }

                // prevCounted used so that things like 4d 0h 2m will be displayed
                let prevCounted = false
                let remainder = a.nextAiringEpisode.timeUntilAiring

                // days
                if (Math.floor(remainder/86400) != 0) {
                    status += ` ${Math.floor(remainder/86400)}d`
                    remainder %= 86400
			        prevCounted = true
                }

                // hours
                if (Math.floor(remainder/3600) != 0 || prevCounted) {
                    status += ` ${Math.floor(remainder/3600)}h`
                    remainder %= 3600
                    prevCounted = true
                }

                status += ` ${Math.floor(remainder/60)}m`
            } else {
                function toTitleCase(str: string): string {
                    return str.replace(/\w\S*/g, function(txt){
                        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                    });
                }
                status = toTitleCase(a.status.replace(/_/g, ' '))
            }

            let allTimePop = 0
            for (let r of a.rankings) {
                if (r.allTime) {
                    allTimePop = r.rank
                    break
                }
            }

            if (allTimePop < 1 && a.rankings.length > 0) {
                allTimePop = a.rankings[0].rank
            }

            let genres = ''
            for (let i = 0; i < a.genres.length; i++) {
                genres += `[${a.genres[i]}](https://anilist.co/search/anime?includedGenres=${encodeURIComponent(a.genres[i])})`
                if (i < a.genres.length - 1) {
                    genres += '  |  '
                }
            }

            return channel.send({
                embed: {
                    url: a.siteUrl,
                    title: a.title.userPreferred,
                    color: this.embedColor,
                    description: description,
                    thumbnail: {
                        url: a.coverImage.large
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
                            value: a.meanScore + '%',
                            inline: true
                        },
                        {
                            name: 'Popularity',
                            value: '#' + allTimePop,
                            inline: true
                        },
                        {
                            name: 'Genres',
                            value: genres === '' ? 'none' : genres,
                            inline: true
                        }
                    ],
                    footer: {
                        icon_url: 'https://avatars2.githubusercontent.com/u/18018524?s=280&v=4',
                        text: 'Fetched from Anilist.co'
                    }
                }
            })
        })
    }

    private queryAnime(id: number): Promise<Anime> {
        return axios.post('https://graphql.anilist.co',
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
}