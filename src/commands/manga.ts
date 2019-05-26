import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel, DMChannel, GroupDMChannel, RichEmbed } from 'discord.js'
import axios from 'axios'
import { XmlEntities } from 'html-entities'
const entities = new XmlEntities()

import { mangaSearchQuery, mangaQuery, randomMangaQuery, apiURL } from '../constants/anilist';
import { Manga } from '../interfaces/anilist';
import { searchChooser } from '../util/anilist';

const TurndownService = require('turndown')
const turndownService = new TurndownService()

export class MangaCommand extends Command {
    private readonly MAX_DESCRIPTION_LENGTH = 256
    private readonly EMBED_COLOR = 0x44b5f0

    constructor(client: CommandoClient) {
        super(client, {
            name: 'manga',
            group: 'weeb',
            memberName: 'manga',
            description: 'Gives quick info about the searched manga.',
            aliases: ['m'],
            examples: ['manga kaguya sama'],
            args: [
                {
                    key: 'manga',
                    prompt: 'please specify the manga to search for.',
                    type: 'string'
                }
            ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }

    async run(msg: CommandMessage, args: { manga: string }): Promise<Message | Message[]> {
        let { respMsg, id } = await searchChooser(mangaSearchQuery, args.manga, msg, this.EMBED_COLOR)

        if (id == -1) { // there was no result
            if (!respMsg) { // no results
                msg.channel.send('No anime found, here\'s a random manga instead.')
                let anime = await this.randomManga()
                return this.sendManga(msg.channel, anime)
            }
        } else {
            let anime = await this.getManga(id)
            return this.sendManga(msg.channel, anime, respMsg)
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

    private getManga(id: number): Promise<Manga> {
        return axios.post(apiURL,
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
        return axios.post(apiURL,
            {
                query: randomMangaQuery,
                variables: {
                    page: 0
                }
            }
        ).then(resp => {
            return axios.post(apiURL,
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