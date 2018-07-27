export interface AnimeList  {
    name: string
    avatar: {
        large: string
    }
    siteUrl: string
    options: {
        profileColor: string
    }
    stats: {
        watchedTime: number
        animeListScores: {
            meanScore: number
        }
        animeStatusDistribution: {
            status: string
            amount: number
        }[]
    }
}