import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js';
import axios from 'axios'

export class CatCommand extends Command {
    constructor(client: CommandoClient) {
        super(client, {
            name: 'cat',
            group: 'fun',
            memberName: 'cat',
            description: 'Gives you a cute cat pic!',
            aliases: ['kitty'],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    run(msg: CommandMessage): Promise<Message | Message[]> {
        return axios.get('http://aws.random.cat/meow').then(resp => {
            return msg.channel.send(resp.data.file)
        }).catch(() => {
            msg.channel.send('Primary cat API request error. Querying backup API...')
            return axios.get('http://thecatapi.com/api/images/get').then(resp => {
                return msg.channel.send(resp.request.res.responseUrl)
            })
        }).catch(err => {
            console.log(err)
            return msg.channel.send('Backup API also failed. -_-')
        })
    }
}