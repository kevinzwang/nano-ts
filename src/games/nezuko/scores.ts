import { User } from "discord.js";
import { connect, Schema, model, Document } from "mongoose";

connect('mongodb://localhost/nezukoBotDB', { useNewUrlParser: true })

const playerSchema = new Schema({
    _id: String,
    score: Number,
    highScore: Number
})

export interface IPlayer extends Document {
    _id: string
    score: number
    highScore: number
}

const Player = model<IPlayer>('players', playerSchema)

export async function addPoints(u: User, p: number): Promise<IPlayer> {
    let res = await Player.findById(u.id)
    if (res) {
        res.score += p
    } else {
        res = new Player({
            _id: u.id,
            score: p
        })
    }
    await res.save()
    return res
}

export async function setHighScore(u: User, s: number) {
    let res = await Player.findById(u.id)
    if (res) {
        if (!res.highScore || res.highScore < s) {
            res.highScore = s
        }
    } else {
        res = new Player({
            _id: u.id,
            highScore: s
        })
    }
    await res.save()
    return res
}

export async function getScores(): Promise<IPlayer[]> {
    return await Player.find().sort('-score')
}