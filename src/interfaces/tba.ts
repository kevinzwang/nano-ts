export interface Team {
    key: string
    team_number: number
    nickname?: string
    name: string
    city?: string
    state_prov?: string
    country?: string
    address?: string
    postal_code?: string
    gmaps_place_id?: string
    gmaps_url?: string
    lat?: number
    lng?: number
    location_name?: string
    website?: string
    rookie_year: number
    motto?: string
    home_championship?: {
        [year: string]: string
    }

    Errors?: any
}

export interface Award {
    name: string
    award_type: number
    event_key: string
    recipient_list: {
        awardee?: string
        team_key: string
    }[]
    year: number
}

export interface Event {
    key: string
    name: string
    event_code: string
    event_type: number
    district?: {
        abbreviation: string
        display_name: string
        key: string
        year: number
    }
    city?: string
    state_prov?: string
    country?: string
    start_date: string
    end_date: string
    year: number
    short_name?: string
    event_type_string: string
    week?: string
    address?: string
    postal_code?: string
    gmaps_place_id?: string
    gmaps_url?: string
    lat?: number
    lng?: number
    location_name?: string
    timezone?: string
    website?: string
    first_event_id?: string
    first_event_code?: string
    webcasts?: {
        type: string
        channel: string
        file?: string
    }[]
    division_keys?: string[]
    parent_event_key?: string
    playoff_type?: number
    playoff_type_string?: string
}

export interface EventStatus {
    qual?: {
        num_teams?: number
        ranking?: {
            dq?: number
            matches_played?: number
            qual_average?: number
            rank?: number
            record?: WLTRecord
            sort_orders?: number[]
            team_key?: string
        }
        sort_order_info?: {
            name?: string
            precision?: number
        }[]
        status?: string
    }
    alliance?: {
        name?: string
        number: number
        backup?: {
            out: string
            in: string
        }
        pick: number
    }
    playoff?: {
        level?: string
        current_level_record?: WLTRecord
        record?: WLTRecord
        status?: string
        playoff_average?: number
    }
    alliance_status_str: string
    playoff_status_str: string
    overall_status_str: string
    next_match_key: string
    last_match_key: string

    Errors?: any
}

export interface WLTRecord {
    losses: number
    wins: number
    ties: number
}