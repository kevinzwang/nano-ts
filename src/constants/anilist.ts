export const animeSearchQuery = `
query SearchAnime ($search: String, $page: Int, $perPage: Int) {
    Page (page: $page, perPage: $perPage) {
        pageInfo {
            total
            hasNextPage
            currentPage
            lastPage
        }
        media(search: $search, type: ANIME) {
            title {
                userPreferred
            }
            siteUrl
            id
        }
    }
}
`
export const animeQuery = `
query AnimeResult ($id: Int) {
    Media (id: $id) {
        title {
            userPreferred
        }
        siteUrl
        description
        format
        status
        meanScore
        rankings {
            rank
            allTime
        }
        genres
        coverImage {
            large
        }
        nextAiringEpisode {
            timeUntilAiring
            episode
        }
    }
}
`

export const animeListQuery = `
query GetAnimeList ($name: String) {
    User (name: $name) {
        name
        avatar {
            large
        }
        siteUrl
        options {
            profileColor
        }
        stats {
            watchedTime
            animeListScores {
                meanScore
            }
            animeStatusDistribution {
                status
                amount
            }
        }
    }
}
`

export const mangaSearchQuery = `
query SearchManga ($search: String, $page: Int, $perPage: Int) {
    Page (page: $page, perPage: $perPage) {
        pageInfo {
            total
            hasNextPage
            currentPage
            lastPage
        }
        media(search: $search, type: MANGA) {
            title {
                userPreferred
            }
      		format
            siteUrl
            id
        }
    }
}
`
export const mangaQuery = `
query MangaResult ($id: Int) {
    Media (id: $id) {
        title {
            userPreferred
        }
        siteUrl
        description
        format
        status
        meanScore
        rankings {
            rank
            allTime
        }
        genres
        coverImage {
            large
        }
    }
}
`

export const mangaListQuery = `
query GetMangaList ($name: String) {
    User (name: $name) {
        name
        avatar {
            large
        }
        siteUrl
        options {
            profileColor
        }
        stats {
            chaptersRead
            mangaListScores {
                meanScore
            }
            mangaStatusDistribution {
                status
                amount
            }
        }
    }
}
`