/**
 * ScoreSaber.ts - ScoreSaber API integration
 * Fetches player data for the shooting gallery
 */

import type { Player } from '../game/PlayerTargets'

const API_BASE = 'https://scoresaber.com/api'

interface ScoreSaberPlayer {
  id: string
  name: string
  profilePicture: string
  country: string
  pp: number
  rank: number
  countryRank: number
}

interface PlayersResponse {
  players: ScoreSaberPlayer[]
  metadata: {
    total: number
    page: number
    itemsPerPage: number
  }
}

export async function fetchTopPlayers(count: number = 100): Promise<Player[]> {
  const players: Player[] = []
  const perPage = 50
  const pages = Math.ceil(count / perPage)

  try {
    for (let page = 1; page <= pages; page++) {
      const response = await fetch(`${API_BASE}/players?page=${page}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: PlayersResponse = await response.json()

      for (const p of data.players) {
        players.push({
          name: p.name,
          rank: p.rank,
          country: p.country,
          pp: p.pp.toFixed(2),
          countryRank: p.countryRank,
          profilePicture: p.profilePicture
        })

        if (players.length >= count) break
      }

      if (players.length >= count) break

      // Small delay between requests to be nice to the API
      await new Promise(r => setTimeout(r, 100))
    }
  } catch (error) {
    console.error('Failed to fetch players:', error)
    // Return sample data as fallback
    return getSamplePlayers()
  }

  return players
}

function getSamplePlayers(): Player[] {
  // Fallback sample data if API fails
  const defaultAvatar = 'https://cdn.scoresaber.com/avatars/oculus.png'
  return [
    { name: 'Bizzy825', rank: 1, country: 'CA', pp: '21027.39', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'oermergeesh', rank: 2, country: 'US', pp: '20970.75', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Brazy', rank: 3, country: 'CA', pp: '20750.65', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Matty', rank: 4, country: 'GB', pp: '20627.97', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Bytesy', rank: 5, country: 'US', pp: '20461.87', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Haste', rank: 6, country: 'NZ', pp: '19888.94', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Shorties1326', rank: 9, country: 'US', pp: '18984.28', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'Kira', rank: 10, country: 'US', pp: '18734.80', countryRank: 4, profilePicture: defaultAvatar },
  ]
}
