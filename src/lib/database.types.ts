export interface Team {
  id: string
  user_id: string
  name: string
  balance: number
  created_at: string
}

export interface BudgetHistory {
  id: string
  team_id: string
  amount: number
  previous_balance: number
  new_balance: number
  description: string | null
  created_at: string
}

export interface BudgetUpdateResult {
  success: boolean
  new_balance?: number
  history_record?: BudgetHistory
  error?: string
}