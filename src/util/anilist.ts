import { MediaSearchPage } from "../interfaces/anilist";
import { Message, RichEmbed } from "discord.js";
import axios from "axios";
import { CommandMessage } from "discord.js-commando";

const API_URL = 'https://graphql.anilist.co'
const PER_PAGE = 8
const TIMEOUT = 60000 // milliseconds

/**
 * Media chooser for anilist queries
 * 
 * @param query the anilist api query
 * @param search the keyword to search for
 * @param color the color of the embed
 */
export async function searchChooser(query: string, search: string, msg: CommandMessage, color: number): Promise<{ respMsg: Message, id: number }> {
    function getSearchPage(page: number): Promise<MediaSearchPage> {
        return axios.post(API_URL,
            {
                query: query,
                variables: {
                    perPage: PER_PAGE,
                    page: page,
                    search: search
                }
            }
        ).then(resp => {
            return resp.data.data.Page as MediaSearchPage
        })
    }

    let currPage = 1
    let page = await getSearchPage(currPage)

    switch (page.pageInfo.total) {
        case 0:
            return { respMsg: null, id: -1 }
        case 1:
            return { respMsg: null, id: page.media[0].id }
    }

    let respMsg: Message

    while (true) {
        // this part sends the embed out
        let results = ''
        for (const [index, media] of page.media.entries()) {
            results += `${index + 1}. [${media.title.userPreferred}](${media.siteUrl})`
            if (index < PER_PAGE - 1) {
                results += '\n'
            }  
        }

        let embed = new RichEmbed({
            title: `Search results for: "${search}" (page ${page.pageInfo.currentPage}/${page.pageInfo.lastPage})`,
            color: color,
            description: results,
            footer: {
                icon_url: 'https://avatars2.githubusercontent.com/u/18018524?s=280&v=4',
                text: 'Type a number to select, "n" to go to the next page, or "c" to cancel.'
            }
        })

        if (respMsg) {
            await respMsg.edit({ embed: embed })
        } else {
            respMsg = await msg.channel.send({ embed: embed }) as Message
        }

        // this part gets the user input
        let filter = (m: Message) => {
            if (!m.author.equals(msg.author)) return false

            let lower = m.content.toLowerCase()
            if (lower === 'c') return true

            if (lower === 'n') {
                return page.pageInfo.hasNextPage
            }

            let n = Number(m.content)
            if (isNaN(n)) return false // if it's not a number
            if (n <= 0 || n > PER_PAGE) return false // if it's not within 1 - 8
            if (!page.pageInfo.hasNextPage && (n > page.pageInfo.total % PER_PAGE && page.pageInfo.total % PER_PAGE != 0)) return false // if it's the last page and it's not within bounds

            return true
        }

        try {
            let collection = await msg.channel.awaitMessages(filter, { time: TIMEOUT, maxMatches: 1, errors: ['time'] })
            let selection = collection.first().content

            collection.first().delete()
            switch (selection) {
                case 'n':
                    page = await getSearchPage(++currPage)
                    break
                case 'c':
                    await respMsg.edit('Search cancelled.', { embed: null })
                    return { respMsg: respMsg, id: -1 }
                default:
                    return { respMsg: respMsg, id: page.media[Number(selection) - 1].id }
            }
        } catch (err) {
            await respMsg.edit('Search timed out.', { embed: null })
            return { respMsg: respMsg, id: -1 }
        }
    }
}