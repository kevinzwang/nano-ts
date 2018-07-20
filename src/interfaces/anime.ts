export interface SearchPage {
    pageInfo: {
        total: number
        hasNextPage: boolean
        currentPage: number
        lastPage: number
    }
    media: {
        title: {
            userPreferred: string
        }
        siteUrl: string
        id: number
    }[]
}

export interface Anime {
    title: {
        userPreferred: string
    }
    siteUrl: string
    description: string
    format: string
    status: string
    meanScore: number
    rankings: {
        rank: number
        allTime: boolean
    }[]
    genres: string[]
    coverImage: {
        large: string
    }
    nextAiringEpisode: {
        timeUntilAiring: number
        episode: number
    }
}