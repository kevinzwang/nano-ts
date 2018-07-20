export const searchQuery = `
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