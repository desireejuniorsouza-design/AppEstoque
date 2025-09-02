import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixhnhnlgqkaoqdihcmdx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4aG5obmxncWthb3FkaWhjbWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDk4ODcsImV4cCI6MjA3MDUyNTg4N30.erO66VxVoXzYweMGORrZifPnuyLTsA7GmIZxC_06BrE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);