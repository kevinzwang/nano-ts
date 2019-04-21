import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel, DMChannel, GroupDMChannel, RichEmbed } from 'discord.js'
import axios from 'axios'
import { XmlEntities } from 'html-entities'
const entities = new XmlEntities()

import { mangaSearchQuery, mangaQuery, randomMangaQuery } from '../constants/anilist';
import { Manga, MangaSearchPage } from '../interfaces/anilist';

const TurndownService = require('turndown')
const turndownService = new TurndownService()

export class MangaCommand extends Command {
    private readonly API_URL = 'https://graphql.anilist.co'
    private readonly MAX_DESCRIPTION_LENGTH = 256
    private readonly EMBED_COLOR = 0x44b5f0
    private readonly PER_PAGE = 8
    private readonly TIMEOUT = 60000 // milliseconds

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
        args = args as string

        let respMsg: Message

        let page = await this.search(args, 1)

        // things to check the first time
        if (page.pageInfo.total == 0) { // shows a random manga if none found
            msg.channel.send('No manga found, here\'s a random manga instead.')
            let manga = await this.randomManga()
            return this.sendManga(msg.channel, manga)
        } else if (page.pageInfo.total == 1) {
            let manga = await this.getManga(page.media[0].id)
            return this.sendManga(msg.channel, manga)
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
                        page = await this.search(args, page.pageInfo.currentPage + 1)
                        respMsg = await this.sendSearch(msg.channel, page, args, respMsg) as Message
                    } else {
                        return respMsg.edit('No more pages.', { embed: null })
                    }
                } else if (selection == 'c') {
                    return respMsg.edit('Search cancelled.', { embed: null })
                } else {
                    let manga = await this.getManga(page.media[Number(selection) - 1].id)
                    return this.sendManga(msg.channel, manga, respMsg)
                }
            } catch (err) {
                return respMsg.edit('Search timed out.', { embed: null })
            }

        }

    }

    private sendManga(channel: TextChannel | DMChannel | GroupDMChannel, manga: Manga, msg?: Message): Promise<Message | Message[]> {
        let description: string = turndownService.turndown(entities.decode(manga.description)).replace(/\s\s+/g, ' ');
        if (description.length > this.MAX_DESCRIPTION_LENGTH) {
            description = description.substring(0, this.MAX_DESCRIPTION_LENGTH - 3) + '...'
        }

        let format: string
        switch (manga.format) {
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
                format = manga.format
        }

        function toTitleCase(str: string): string {
            return str.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
        let status = toTitleCase(manga.status.replace(/_/g, ' '))

        let allTimePop = 0
        for (let r of manga.rankings) {
            if (r.allTime) {
                allTimePop = r.rank
                break
            }
        }

        let genres = ''
        for (let i = 0; i < manga.genres.length; i++) {
            genres += `[${manga.genres[i]}](https://anilist.co/search/manga?includedGenres=${encodeURIComponent(manga.genres[i])})`
            if (i < manga.genres.length - 1) {
                genres += '  |  '
            }
        }

        let embed = new RichEmbed({
            url: manga.siteUrl,
            title: manga.title.userPreferred,
            color: this.EMBED_COLOR,
            description: description,
            thumbnail: {
                url: manga.coverImage.large
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
                    value: manga.meanScore ? manga.meanScore + '%' : '¯\\_(ツ)_/¯',
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

    private search(search: string, page: number): Promise<MangaSearchPage> {
        return axios.post(this.API_URL,
            {
                query: mangaSearchQuery,
                variables: {
                    perPage: this.PER_PAGE,
                    page: page,
                    search: search
                }
            }
        ).then(resp => {
            return resp.data.data.Page as MangaSearchPage
        })
    }

    private sendSearch(channel: TextChannel | DMChannel | GroupDMChannel, page: MangaSearchPage, search: string, msg?: Message): Promise<Message | Message[]> {
        let results = ''
        for (const [index, manga] of page.media.entries()) {
            results += `${index + 1}. [${manga.title.userPreferred}](${manga.siteUrl})`
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

    private getManga(id: number): Promise<Manga> {
        return axios.post(this.API_URL,
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

    private randomManga(): Promise<Manga> {
        return axios.post(this.API_URL,
            {
                query: randomMangaQuery,
                variables: {
                    page: 0
                }
            }
        ).then(resp => {
            return axios.post(this.API_URL,
                {
                    query: randomMangaQuery,
                    variables: {
                        page: Math.floor(Math.random() * resp.data.data.Page.pageInfo.total)
                    }
                }
            )
        }).then(resp => {
            return resp.data.data.Page.media[0] as Manga
        })
    }
}