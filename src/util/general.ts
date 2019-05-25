import * as path from 'path'

export function getAssetPath(asset: string): string {
    return path.join(__dirname, '../../assets', asset)
}
