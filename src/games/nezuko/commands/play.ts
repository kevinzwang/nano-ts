import { Message, MessageReaction, User } from "discord.js";
import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'

import { getAssetPath } from "../../../util";
import { Mode, getRandomModeAsync } from '../game-modes'
import { wordExists, constructWordsList } from "../words";
import { addPoints, setHighScore } from "../scores";
import { description } from "..";

export class PlayCommand extends Command {
    private readonly timeLimits = [0, 120, 90, 60, 40, 30, 20, 15, 12, 10, 9, 8, 7, 6, 5]
    private currentGames = new Set<string>()

    constructor(client: CommandoClient) {
        super (client, {
            name: '!play',
            group: 'game',
            memberName: '!play',
            description: 'Plays the game!',
            guildOnly: true,
            aliases: [ '!p' ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })

        constructWordsList()
    }
    async run(msg: CommandMessage): Promise<Message | Message[]> {
        if (this.currentGames.has(msg.channel.id)) {
            return msg.reply('Wait for the current game to end!')
        }

        this.currentGames.add(msg.channel.id)
        let startMsg = await msg.channel.send({ 
            embed: {
                title: 'Spring 2019 game: Demon Slayer',
                color: 0xFFC0CB,
                description: description + '\n\nTo play, react to this message.',
                file: getAssetPath('demon-slayer.jpg'),
                image: {
                    url: 'attachment://demon-slayer.jpg'
                }
            }
        }) as Message

        await startMsg.react('⚔')

        let players = new Set<User>()

        startMsg.awaitReactions(() => true, { time: 10000 /* 10 seconds */ }).then(collected => {
            collected.every((reaction: MessageReaction) => {
                reaction.users.every((usr: User) => {
                    if (!usr.bot && !players.has(usr)) {
                        players.add(usr)
                    }
                    return true;
                })
                return true;
            })
        })

        let gameMode:Mode
        getRandomModeAsync((m) => { gameMode = m })

        let joinTime = await msg.channel.send('♥♥♥♥♥♥♥♥♥♥') as Message
        for (let i = 1; i <= 5; i++) {
            await this.delay(2000)
            joinTime.edit('♥'.repeat(2*(5-i)) + '💘'.repeat(2*i))
        }

        if (players.size == 0) {
            this.currentGames.delete(msg.channel.id)
            return joinTime.edit('Nobody joined the game :(')
        }

        await joinTime.edit('⚔ Game started! ⚔')

        let origPlayers = [...players]
        let currPlayers = [...players]
        let villageCount = 1
        let gamePoints: {[id:string]: number} = {}
        players.forEach(p => {
            gamePoints[p.id] = 0
        })

        while (players.size > 0) {
            let timeLimit:number
            if (villageCount < this.timeLimits.length - 1) {
                timeLimit = this.timeLimits[villageCount]
            } else {
                timeLimit = this.timeLimits[this.timeLimits.length - 1]
            }
            msg.channel.send(`Village ${villageCount}: ${gameMode.start()}\nNumber of demons: **5**, Time until sunset: **${timeLimit}** seconds`)

            let saidWords:string[] = []
            let villagePoints: {[id:string]: number} = {}

            players.forEach(p => {
                villagePoints[p.id] = 0
            })

            let filter = (m: Message): boolean => {
                if (!players.has(m.author)) return false

                let content = m.content.trim().toLowerCase()

                // check if message is a word
                if (!/^[a-z\-]+$/.test(content)) return false

                // check if message is a legitimate word
                if (!wordExists(content)) {
                    m.reply(`${content} isn't a legit word, probably. You lose.`)
                    players.delete(m.author)

                    if (players.size == 0) {
                        this.end(msg, origPlayers, currPlayers, gamePoints)
                    }
                    return false
                }

                // check if message has already been said
                if (saidWords.includes(content)) {
                    m.reply(`${content} has already been said in this village! You lose.`)
                    players.delete(m.author)

                    if (players.size == 0) {
                        this.end(msg, origPlayers, currPlayers, gamePoints)
                    }
                    return false
                }

                // check if word matches
                let fail = gameMode.check(content)
                if (fail) {
                    m.reply(fail)
                    players.delete(m.author)

                    if (players.size == 0) {
                        this.end(msg, origPlayers, currPlayers, gamePoints)
                    }
                    return false
                }

                // finally if everything is good
                saidWords.push(content)
                m.react('✅')
                
                villagePoints[m.author.id]++

                return true
            }

            let collector = await msg.channel.awaitMessages(filter, { time: timeLimit * 1000, maxMatches: 5 })

            if (players.size == 0) break;

            if (collector.size < 5) {
                await msg.channel.send(`Time's up! ${collector.size} out of 5 demons defeated.`)
                return this.end(msg, origPlayers, currPlayers, gamePoints)
            }

            let victoryMsg = 'Village Cleared!'
            players.forEach(u => {
                victoryMsg += `\n+${villagePoints[u.id]} ${u}`
                gamePoints[u.id] += villagePoints[u.id]
            })
            victoryMsg += '\n\nNext village in 5 seconds...'
            await msg.channel.send(victoryMsg)

            /*
            Prep for next game
            */
            getRandomModeAsync((m) => { gameMode = m })
            currPlayers = [...players]
            villageCount++

            await this.delay(1000)
            let cooldownTime = await msg.channel.send('♥♥♥♥💘') as Message
            for (let i = 1; i <= 2; i++) {
                await this.delay(2000)
                cooldownTime.edit('♥'.repeat(2*(2-i)) + '💘'.repeat(2*i) + '💘')
            }
        }
        
        this.currentGames.delete(msg.channel.id)
        return startMsg
    }

    async end(msg: CommandMessage, origPlayers: User[], lastPlayers: User[], gamePoints: {[id:string]: number}): Promise<Message | Message[]> {
        let finalBonus = Math.floor((origPlayers.length - lastPlayers.length) * 5 / lastPlayers.length)
        if (finalBonus > 0) {
            let finalBonusMsg = `+${finalBonus} Final Bonus -`
            lastPlayers.forEach(usr => {
                finalBonusMsg += ' ' + usr
                gamePoints[usr.id] += finalBonus
            })
            msg.channel.send(finalBonusMsg)
        }

        let endMsg = '__Final Scores:__'
        for (let u of origPlayers) {
            endMsg += `\n${u} - ${gamePoints[u.id]}`
            addPoints(u, gamePoints[u.id])
            setHighScore(u, gamePoints[u.id])
        }

        this.currentGames.delete(msg.channel.id)

        return msg.channel.send(endMsg + `\n\n💔 Game Over! 💔`)
    }

    /**
     * setTimeout wrapper for promises for use in async functions
     * 
     * @param time the time to delay in milliseconds
     */
    async delay(time: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, time)
        })
    }
}