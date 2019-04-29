import axios from 'axios'

let wordsList:string[] = []

export function constructWordsList() {
    axios.get('https://raw.githubusercontent.com/dwyl/english-words/master/words.txt', { responseType: 'text' }).then(resp => {
        for (let word of (resp.data as string).split('\n')) {
            if (/^[a-zA-Z\-]+$/.test(word)) {
                wordsList.push(word.toLowerCase())
            }
        }
        wordsList.sort()
    })
}

export function wordExists(w:string): boolean {
    let min = 0, max = wordsList.length
    while (min < max) {
        let mid = Math.floor((min + max) / 2)

        let compare = w.localeCompare(wordsList[mid])
        if (compare == 0) { // word matches
            return true
        } else if (compare < 0) { // word is lexically smaller
            max = mid
        } else { // word is lexically bigger
            min = mid+1
        }
    }
    return false
}