import { supabase } from "./supabase.ts";
import type { Team, BudgetHistory, BudgetUpdateResult } from './database.types'

// Team CRUD Operations
export async function createTeam(name: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .insert({ name })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating team:', error)
    return null
  }
  return data
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*')
  return error ? [] : data
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()
  return error ? null : data
}

// Optimized budget operation using PostgreSQL function
export async function updateTeamBudget({
  teamId,
  amount,
  description
}: {
  teamId: string
  amount: number
  description?: string
}): Promise<BudgetUpdateResult> {
  const { data, error } = await supabase.rpc('update_team_balance', {
    team_id: teamId,
    amount,
    description: description || null
  })

  if (error) return { success: false, error: error.message }
  return data
}

export async function getBudgetHistory(
  teamId: string,
  limit = 50
): Promise<BudgetHistory[]> {
  const { data, error } = await supabase
    .from('budget_history')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return error ? [] : data
}

export async function getCurrentBalance(teamId: string): Promise<number | null> {
  const team = await getTeam(teamId)
  return team?.balance ?? null
}