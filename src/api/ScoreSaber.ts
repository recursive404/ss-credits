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
          profilePicture: p.profilePicture,
          color: Math.random() > 0.5 ? 'red' : 'blue' // Random red/blue assignment
        })

        if (players.length >= count) break
      }

      if (players.length >= count) break

      // Small delay between requests to be nice to the API
      await new Promise(r => setTimeout(r, 100))
    }

    console.log(`✅ Fetched ${players.length} players from API`)
  } catch (error) {
    console.error('Failed to fetch players (CORS?):', error)
    console.log('📦 Using bundled player data...')
    return getSamplePlayers()
  }

  return players
}

function getSamplePlayers(): Player[] {
  // Bundled top 100 players as fallback (CORS issues with ScoreSaber API)
  const defaultAvatar = 'https://cdn.scoresaber.com/avatars/oculus.png'
  const players: Omit<Player, 'color'>[] = [
    { name: 'Bizzy825', rank: 1, country: 'CA', pp: '21027.39', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'oermergeesh', rank: 2, country: 'US', pp: '20970.75', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Brazy', rank: 3, country: 'CA', pp: '20750.65', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Matty', rank: 4, country: 'GB', pp: '20627.97', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Bytesy', rank: 5, country: 'US', pp: '20461.87', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Haste', rank: 6, country: 'NZ', pp: '19888.94', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'chaturbate demon', rank: 7, country: 'GB', pp: '19770.54', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Shorties1326', rank: 9, country: 'US', pp: '18984.28', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'Kira', rank: 10, country: 'US', pp: '18734.80', countryRank: 4, profilePicture: defaultAvatar },
    { name: 'Davin', rank: 11, country: 'US', pp: '18713.44', countryRank: 5, profilePicture: defaultAvatar },
    { name: 'Kaelorr', rank: 12, country: 'US', pp: '18548.63', countryRank: 6, profilePicture: defaultAvatar },
    { name: 'Huskereeno', rank: 13, country: 'IS', pp: '18484.96', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Arab Twink', rank: 14, country: 'US', pp: '18418.10', countryRank: 7, profilePicture: defaultAvatar },
    { name: 'TornadoEF6', rank: 15, country: 'US', pp: '18377.59', countryRank: 8, profilePicture: defaultAvatar },
    { name: 'Marsh_era', rank: 16, country: 'JP', pp: '18307.85', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Smallfox', rank: 17, country: 'SE', pp: '18245.11', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Shoogie', rank: 18, country: 'IL', pp: '18218.22', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Tranch', rank: 19, country: 'US', pp: '18060.96', countryRank: 9, profilePicture: defaultAvatar },
    { name: 'snowwisslow', rank: 20, country: 'US', pp: '18057.20', countryRank: 10, profilePicture: defaultAvatar },
    { name: 'thinking', rank: 21, country: 'US', pp: '18040.81', countryRank: 11, profilePicture: defaultAvatar },
    { name: 'LeF273', rank: 22, country: 'US', pp: '17926.74', countryRank: 12, profilePicture: defaultAvatar },
    { name: 'BASKINMYMUDPILE', rank: 23, country: 'US', pp: '17909.63', countryRank: 13, profilePicture: defaultAvatar },
    { name: 'Sands', rank: 24, country: 'HU', pp: '17903.37', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'penguiin', rank: 25, country: 'US', pp: '17861.99', countryRank: 14, profilePicture: defaultAvatar },
    { name: 'Plus', rank: 26, country: 'CA', pp: '17709.31', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'NailikLP', rank: 27, country: 'DE', pp: '17702.00', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'udon', rank: 28, country: 'US', pp: '17665.89', countryRank: 15, profilePicture: defaultAvatar },
    { name: 'hua leu tan tan tan', rank: 29, country: 'US', pp: '17530.08', countryRank: 16, profilePicture: defaultAvatar },
    { name: 'speecil', rank: 30, country: 'AU', pp: '17502.73', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'William Virtual Reality', rank: 31, country: 'AU', pp: '17460.59', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Tiku', rank: 32, country: 'ES', pp: '17403.89', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Luck', rank: 33, country: 'DK', pp: '17399.80', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Taichidesu', rank: 34, country: 'JP', pp: '17392.20', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Rac', rank: 35, country: 'DK', pp: '17387.00', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Ayyserr', rank: 36, country: 'US', pp: '17348.17', countryRank: 17, profilePicture: defaultAvatar },
    { name: 'Parapass', rank: 37, country: 'US', pp: '17332.97', countryRank: 18, profilePicture: defaultAvatar },
    { name: 'SaltyButter', rank: 38, country: 'US', pp: '17304.85', countryRank: 19, profilePicture: defaultAvatar },
    { name: 'VoltageO', rank: 39, country: 'GB', pp: '17270.64', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'BSFR | risi', rank: 40, country: 'FR', pp: '17221.51', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Shani132', rank: 41, country: 'NZ', pp: '17190.61', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'charlie1epicdude', rank: 42, country: 'FR', pp: '17188.99', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Rotech', rank: 43, country: 'AU', pp: '17175.23', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'fqrb', rank: 45, country: 'NL', pp: '17103.02', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Kryptec', rank: 46, country: 'US', pp: '17102.03', countryRank: 20, profilePicture: defaultAvatar },
    { name: 'Tseska', rank: 48, country: 'FI', pp: '17043.07', countryRank: 1, profilePicture: defaultAvatar },
    { name: '_Robertas', rank: 49, country: 'SE', pp: '17037.11', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'A-tach', rank: 50, country: 'JP', pp: '17001.93', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'yabje', rank: 51, country: 'NL', pp: '16850.93', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'laaazi', rank: 52, country: 'US', pp: '16832.62', countryRank: 22, profilePicture: defaultAvatar },
    { name: 'Mewtex', rank: 54, country: 'US', pp: '16748.97', countryRank: 23, profilePicture: defaultAvatar },
    { name: 'Shashumga', rank: 55, country: 'NL', pp: '16717.49', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'Tanhis', rank: 56, country: 'FI', pp: '16703.79', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'HolyKaes', rank: 57, country: 'NL', pp: '16635.88', countryRank: 4, profilePicture: defaultAvatar },
    { name: 'Stud3nt_4thlete', rank: 58, country: 'CA', pp: '16588.94', countryRank: 4, profilePicture: defaultAvatar },
    { name: 'IlluminatiSalad', rank: 59, country: 'RU', pp: '16585.46', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Kaizen', rank: 60, country: 'NZ', pp: '16535.44', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'blinxap', rank: 61, country: 'US', pp: '16530.15', countryRank: 24, profilePicture: defaultAvatar },
    { name: 'CoolingCloset', rank: 62, country: 'NL', pp: '16529.57', countryRank: 5, profilePicture: defaultAvatar },
    { name: 'JujuLipz', rank: 63, country: 'AU', pp: '16515.58', countryRank: 4, profilePicture: defaultAvatar },
    { name: 'Dasher3992', rank: 64, country: 'US', pp: '16464.23', countryRank: 25, profilePicture: defaultAvatar },
    { name: 'Creeper', rank: 65, country: 'AU', pp: '16420.62', countryRank: 5, profilePicture: defaultAvatar },
    { name: 'tecmonke', rank: 66, country: 'US', pp: '16389.03', countryRank: 26, profilePicture: defaultAvatar },
    { name: 'Yurkleee', rank: 67, country: 'GB', pp: '16362.62', countryRank: 4, profilePicture: defaultAvatar },
    { name: 'Adi', rank: 68, country: 'BG', pp: '16281.70', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Hatsune Miku', rank: 69, country: 'US', pp: '16275.13', countryRank: 27, profilePicture: defaultAvatar },
    { name: 'pinapple', rank: 70, country: 'GB', pp: '16272.32', countryRank: 5, profilePicture: defaultAvatar },
    { name: 'Staces', rank: 71, country: 'US', pp: '16259.46', countryRank: 28, profilePicture: defaultAvatar },
    { name: 'BigOlDumplin', rank: 72, country: 'NL', pp: '16223.87', countryRank: 6, profilePicture: defaultAvatar },
    { name: 'Moepop', rank: 73, country: 'US', pp: '16219.00', countryRank: 29, profilePicture: defaultAvatar },
    { name: 'Noob_8', rank: 74, country: 'US', pp: '16198.58', countryRank: 30, profilePicture: defaultAvatar },
    { name: 'raccoonvr', rank: 75, country: 'CA', pp: '16182.40', countryRank: 5, profilePicture: defaultAvatar },
    { name: 'Praunt', rank: 76, country: 'BR', pp: '16181.29', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'Xarope93', rank: 78, country: 'BR', pp: '16158.17', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'VortexWizrd', rank: 79, country: 'US', pp: '16146.56', countryRank: 32, profilePicture: defaultAvatar },
    { name: 'Latest', rank: 80, country: 'NO', pp: '16074.86', countryRank: 1, profilePicture: defaultAvatar },
    { name: 'WDG_Death', rank: 81, country: 'US', pp: '16055.54', countryRank: 33, profilePicture: defaultAvatar },
    { name: 'chicken', rank: 82, country: 'US', pp: '16043.99', countryRank: 34, profilePicture: defaultAvatar },
    { name: 'floatyoats', rank: 83, country: 'GB', pp: '16043.03', countryRank: 6, profilePicture: defaultAvatar },
    { name: 'Simbo', rank: 84, country: 'DK', pp: '16036.61', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'sharkzy', rank: 85, country: 'CA', pp: '16018.55', countryRank: 6, profilePicture: defaultAvatar },
    { name: 'remondv', rank: 86, country: 'NL', pp: '15993.00', countryRank: 7, profilePicture: defaultAvatar },
    { name: 'Derpypig42', rank: 87, country: 'US', pp: '15978.33', countryRank: 35, profilePicture: defaultAvatar },
    { name: 'azu azu', rank: 88, country: 'US', pp: '15972.58', countryRank: 36, profilePicture: defaultAvatar },
    { name: 'PulseLane', rank: 89, country: 'US', pp: '15968.02', countryRank: 37, profilePicture: defaultAvatar },
    { name: 'AceBat', rank: 90, country: 'US', pp: '15966.74', countryRank: 38, profilePicture: defaultAvatar },
    { name: 'ima', rank: 91, country: 'US', pp: '15942.08', countryRank: 39, profilePicture: defaultAvatar },
    { name: 'edgyguns', rank: 92, country: 'US', pp: '15930.51', countryRank: 40, profilePicture: defaultAvatar },
    { name: 'twerklearner456', rank: 93, country: 'US', pp: '15918.88', countryRank: 41, profilePicture: defaultAvatar },
    { name: 'Mr_biologie', rank: 94, country: 'NL', pp: '15913.24', countryRank: 8, profilePicture: defaultAvatar },
    { name: 'Swimerx', rank: 95, country: 'US', pp: '15886.18', countryRank: 42, profilePicture: defaultAvatar },
    { name: 'Dr.Bread', rank: 96, country: 'DE', pp: '15868.28', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'Manski', rank: 97, country: 'US', pp: '15830.63', countryRank: 43, profilePicture: defaultAvatar },
    { name: 'I drink soda I eat pizza', rank: 98, country: 'FR', pp: '15829.82', countryRank: 3, profilePicture: defaultAvatar },
    { name: 'noam15A', rank: 99, country: 'IL', pp: '15783.26', countryRank: 2, profilePicture: defaultAvatar },
    { name: 'MinnieFops', rank: 100, country: 'AU', pp: '15772.94', countryRank: 6, profilePicture: defaultAvatar },
  ]

  // Assign random red/blue colors
  return players.map(p => ({
    ...p,
    color: Math.random() > 0.5 ? 'red' as const : 'blue' as const
  }))
}
