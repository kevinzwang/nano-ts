export interface SpoilerMsg {
    message: string
    channel: string
}

export interface InviteResponse {
    invite: string
}

export interface IDResponse {
    id: string
}

export interface ProcessEvent {
    type: 'SPOILER' | 'EXIT' | 'INVITE_REQUEST' | 'INVITE_RESPONSE' | 'ID_REQUEST' | 'ID_RESPONSE'
    data?: SpoilerMsg | InviteResponse | IDResponse
}