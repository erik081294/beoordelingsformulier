import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jcwfcyddmvhnquwierds.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjd2ZjeWRkbXZobnF1d2llcmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NDMwODIsImV4cCI6MjA1MDAxOTA4Mn0.Ri3w5w4jrCTTgnxvZRtwHw5EHYy1Xzl1ZeW7eTXUJCU'

export const supabase = createClient(supabaseUrl, supabaseKey) 