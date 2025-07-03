import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchDataFromAPI() {
  const response = await fetch('https://api-fantasy.llt-services.com/api/v4/players?x-lang=es')
  if (!response.ok) {
    throw new Error(`Failed to fetch API: ${response.statusText}`)
  }
  const data = await response.json()
  return data
}

function mapPlayers(apiPlayers) {
  // Filter out players with "playerStatus": "out_of_league"
  const filtered = apiPlayers
    .filter(p =>
      p.nickname &&
      p.playerStatus &&
      p.playerStatus !== "out_of_league" &&
      p.team && p.team.id && p.team.name && p.team.badgeColor &&
      p.images && p.images.transparent && p.images.transparent["256x256"]
    );
  return filtered.map((p, idx) => ({
    id: idx + 1, // Set id as the position (starting from 1)
    playerName: p.nickname,
    playerStatus: p.playerStatus,
    teamId: parseInt(p.team.id, 10),
    teamName: p.team.name,
    teamBadge: p.team.badgeColor,
    playerImage: p.images.transparent["256x256"]
  }))
}

async function clearSupabaseTable() {
  const { error } = await supabase.from('players').delete().neq('id', 0)
  if (error) {
    console.error('Error clearing Supabase table:', error)
  } else {
    console.log('Supabase table cleared')
  }
}

async function insertIntoSupabase(players) {
  const { error } = await supabase.from('players').insert(players)
  if (error) {
    console.error('Error inserting into Supabase:', error)
  } else {
    console.log('Data successfully inserted into Supabase')
  }
}

async function run() {
  try {
    await clearSupabaseTable()
    const apiData = await fetchDataFromAPI()
    const players = mapPlayers(apiData.players || apiData)
    await insertIntoSupabase(players)
  } catch (err) {
    console.error('Error:', err)
  }
}

run()