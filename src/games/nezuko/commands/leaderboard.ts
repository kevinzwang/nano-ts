import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import { getScores } from '../scores';

export class LeaderboardCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: '!leaderboard',
            group: 'game',
            memberName: '!leaderboard',
            description: 'Displays the game leaderboards.',
            aliases: [ '!lb' ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    async run(msg: CommandMessage): Promise<Message | Message[]> {
        let res = await getScores()
        
        let board = '```\nName                                 Total    High\n--------------------------------------------------'
        for (let p of res) {
            let usr = await msg.client.fetchUser(p._id)
            board += '\n' + usr.username + '.'.repeat(42-usr.username.length-p.score.toString().length) + p.score + '.'.repeat(8-p.highScore.toString().length) + p.highScore
        }
        board += '```'

        return msg.channel.send(board)
    }
}