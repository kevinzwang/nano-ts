import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel, DMChannel, GroupDMChannel, RichEmbed } from 'discord.js'
import axios from 'axios'
import { XmlEntities } from 'html-entities'
const entities = new XmlEntities()

import { animeQuickSearchQuery, animeSearchQuery, animeQuery, randomAnimeQuery, apiURL } from '../constants/anilist';
import { Anime } from '../interfaces/anilist';
import { searchChooser } from '../util/anilist';

const TurndownService = require('turndown')
const turndownService = new TurndownService()

export class AnimeCommand extends Command {
    private readonly MAX_DESCRIPTION_LENGTH = 256
    private readonly EMBED_COLOR = 0x44b5f0

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
            args: [
                {
                    key: 'anime',
                    prompt: 'please specify the anime to search for.',
                    type: 'string'
                }
            ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }

    async run(msg: CommandMessage, args: string[] | { anime: string }, fromPattern: boolean): Promise<Message | Message[]> {
        if (fromPattern) { // quick search
            let search = (args as string[])[1] // gets the second result which is the not curly brace

            let anime = await this.quickSearch(search)

            if (anime) {
                return this.sendAnime(msg.channel, anime)
            }
        } else {
            let { respMsg, id } = await searchChooser(animeSearchQuery, (args as { anime: string }).anime, msg, this.EMBED_COLOR)

            if (id == -1) { // there was no result
                if (!respMsg) { // no results
                    msg.channel.send('No anime found, here\'s a random anime instead.')
                    let anime = await this.randomAnime()
                    return this.sendAnime(msg.channel, anime)
                }
            } else {
                let anime = await this.getAnime(id)
                return this.sendAnime(msg.channel, anime, respMsg)
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
        return axios.post(apiURL,
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

    private getAnime(id: number): Promise<Anime> {
        return axios.post(apiURL,
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
        return axios.post(apiURL,
            {
                query: randomAnimeQuery,
                variables: {
                    page: 0
                }
            }
        ).then(resp => {
            return axios.post(apiURL,
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