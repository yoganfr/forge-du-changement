import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kpgkxeilddeyfwiiqaha.supabase.co'
const SUPABASE_KEY = 'sb_publishable_DCQmdJiBvSNRHTz0qCIqyg_CTYZiIs-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
