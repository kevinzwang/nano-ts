import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel, DMChannel, GroupDMChannel } from 'discord.js';
import axios from 'axios'
import { XmlEntities } from 'html-entities'
const entities = new XmlEntities()

const TurndownService = require('turndown')
const turndownService = new TurndownService()

import { mangaSearchQuery, mangaQuery } from '../constants/anilist'
import { MangaSearchPage, Manga } from '../interfaces/anilist'

export class MangaCommand extends Command {
    readonly perPage: number = 8
    readonly embedColor: number = 0x44b5f0
    readonly maxDescLen: number = 256

    constructor(client: CommandoClient) {
        super(client, {
            name: 'manga',
            group: 'weeb',
            memberName: 'manga',
            description: 'Gives quick info about the searched manga.',
            aliases: ['m'],
            examples: ['manga kaguya sama'],
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
            let page = await this.searchManga(args, pageCount)
            if (page.pageInfo.total == 0) {
                return msg.channel.send('Here I am, brain the size of a planet and they ask me to search for manga that doesn\'t exist.')
            } else if (page.pageInfo.total == 1) {
                return this.sendManga(msg.channel, page.media[0].id)
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
                return this.sendManga(msg.channel, chosenId)
            } catch (err) {
                return msg.reply(`Took too long to choose for query "${args}"`)
            }
        }
    }

    private searchManga(search: string, page: number): Promise<MangaSearchPage> {
        return axios.post('https://graphql.anilist.co',
            {
                query: mangaSearchQuery,
                variables: {
                    perPage: this.perPage,
                    page: page,
                    search: search
                }
            }
        ).then(resp => {
            return resp.data.data.Page as MangaSearchPage
        })
    }

    private sendSearch(channel: TextChannel | DMChannel | GroupDMChannel, page: MangaSearchPage, search: string): Promise<Message | Message[]> {
        let results = ''
        for (const [index, manga] of page.media.entries()) {
            let format: string
            switch(manga.format) {
                case 'NOVEL':
                    format = 'LN'
                    break
                case 'ONE_SHOT':
                    format = 'ONE SHOT'
                    break;
                default:
                    format = manga.format
            }

            results += `${index + 1}. [${manga.title.userPreferred} [${format}]](${manga.siteUrl})`
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

    private sendManga(channel: TextChannel | DMChannel | GroupDMChannel, id: number): Promise<Message | Message[]> {
        return this.queryManga(id).then(m => {
            let description: string = turndownService.turndown(entities.decode(m.description)).replace(/\s\s+/g, ' ');
            if (description.length > this.maxDescLen) {
                description = description.substring(0, this.maxDescLen - 3) + '...'
            }

            let format: string
            switch (m.format) {
                case 'MANGA':
                    format = 'Manga'
                    break
                case 'NOVEL':
                    format = 'Light Novel'
                    break
                case 'ONE_SHOT':
                    format = 'One Shot'
                    break;
                default:
                    format = m.format
            }

            function toTitleCase(str: string): string {
                return str.replace(/\w\S*/g, function(txt){
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            }
            let status = toTitleCase(m.status.replace(/_/g, ' '))

            let allTimePop = 0
            for (let r of m.rankings) {
                if (r.allTime) {
                    allTimePop = r.rank
                    break
                }
            }

            let genres = ''
            for (let i = 0; i < m.genres.length; i++) {
                genres += `[${m.genres[i]}](https://anilist.co/search/manga?includedGenres=${encodeURIComponent(m.genres[i])})`
                if (i < m.genres.length - 1) {
                    genres += '  |  '
                }
            }

            return channel.send({
                embed: {
                    url: m.siteUrl,
                    title: m.title.userPreferred,
                    color: this.embedColor,
                    description: description,
                    thumbnail: {
                        url: m.coverImage.large
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
                            value: m.meanScore ? m.meanScore + '%' : '¯\\_(ツ)_/¯',
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
                }
            })
        })
    }

    private queryManga(id: number): Promise<Manga> {
        return axios.post('https://graphql.anilist.co',
            {
                query: mangaQuery,
                variables: {
                    id: id
                }
            }
        ).then(resp => {
            return resp.data.data.Media as Manga
        })
    }
}