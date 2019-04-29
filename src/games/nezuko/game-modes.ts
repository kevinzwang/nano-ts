import { readFileSync } from "fs";
import axios from "axios"

import { getAssetPath } from "../../util";

export interface Mode {
    start(): string
    check(s:string): null | string
}

let commonWords = readFileSync(getAssetPath('words.1000.txt')).toString().split('\n')
let commonWords2 = readFileSync(getAssetPath('words.5000.txt')).toString().split('\n')

export class Rhyme implements Mode {
    readonly MIN_RHYMES = 15

    word:string
    rhymes:string[]
    public constructor() {
        this.findWord().then(word => { this.word = word })
        this.rhymes = []
    }

    async findWord(): Promise<string> {
        while (true) {
            let currWord = commonWords[Math.floor(Math.random() * commonWords.length)]

            let resp = await axios.get('https://api.datamuse.com/words?rel_rhy=' + currWord)
            let data = resp.data as Array<any>

            let count = 0
            for (let d of data ) {
                if (/^[a-z\-]+$/.test(d.word)) {
                    count++
                }
            }

            if (count >= this.MIN_RHYMES) {
                data.forEach((val) => {
                    this.rhymes.push(val.word);
                })

                return currWord
            }
        }
    }

    public start(): string {
        return `Words that rhyme with **${this.word}**`
    }

    public check(s:string): null | string {
        if (!this.rhymes.includes(s)) {
            return `**${s}** doesn't rhyme with **${this.word}**, probably.`
        } else if (this.word == s) {
            return `you can't just use rhyme ${this.word} with ${s}!`
        }
    }
}

export class StartsWith implements Mode {
    letters:string
    public constructor() {
        let currWord = ''
        while (currWord.length < 2) {
            currWord = commonWords[Math.floor(Math.random() * commonWords.length)]

        }

        this.letters = currWord.substring(0, 2)
    }

    public start(): string {
        return `Words that start with the letters **${this.letters}**`
    }

    public check(s:string): null | string {
        if (s.length < 2 || s.substring(0, 2) != this.letters) {
            return `**${s}** doesn't start with **${this.letters}**!`
        }
    }
}

export class Length implements Mode {
    readonly MIN_LEN = 3
    readonly MAX_LEN = 9

    len:number
    public constructor() {
        while (!this.len) {
            let currLen = commonWords[Math.floor(Math.random() * commonWords.length)].length

            if (currLen >= this.MIN_LEN && currLen <= this.MAX_LEN) {
                this.len = currLen
            }
        }
    }

    public start(): string {
        return `Words that are of length **${this.len}**`
    }

    public check(s:string): null | string {
        if (s.length != this.len) {
            return `**${s}** isn't **${this.len}** letters long!`
        }
    }
}

export class EndsWith implements Mode {
    letter:string
    public constructor() {
        this.letter = commonWords[Math.floor(Math.random() * commonWords.length)].charAt(0)
    }

    public start(): string {
        return `Words that end with the letter **${this.letter}**`
    }

    public check(s:string): null | string {
        if (s.charAt(s.length - 1) != this.letter) {
            return `**${s}** doesn't end with **${this.letter}**!`
        }
    }
}

export class Contains implements Mode {
    letters:string
    public constructor() {
        while (!this.letters) {
            let currWord = ''
            while (currWord.length < 3) {
                currWord = commonWords[Math.floor(Math.random() * commonWords.length)]

            }

            let l = currWord.substring(0, 3)

            let count = 0
            for (let word of commonWords2) {
                if (word.includes(l)) {
                    count++
                }
            }

            if (count >= 15) {
                this.letters = l
            }
        }
    }

    public start(): string {
        return `Words that contain **${this.letters}**`
    }

    public check(s:string): null | string {
        if (!s.includes(this.letters)) {
            return `**${s}** doesn't contain **${this.letters}**!`
        }
    }
}

let modes = [ /* Rhyme,*/ StartsWith, Length, EndsWith, Contains ]

export function getRandomMode(): Mode {
    return new (modes[Math.floor(Math.random() * modes.length)])()
}

export function getRandomModeAsync(cb: (m:Mode) => void) {
    cb(getRandomMode())
}