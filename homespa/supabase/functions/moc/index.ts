// Supabase Edge Function "moc". Triển khai: supabase functions deploy moc
// Bí mật cần đặt (Ly làm, không ghi vào code): supabase secrets set ANTHROPIC_API_KEY=...  (tùy chọn MOC_MODEL)
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handle } from './handler.ts'

Deno.serve(req => handle(req, Deno.env, {
  fetch,
  // Dùng chính phiên đăng nhập của người hỏi → RLS áp dụng như trong app (không dùng service_role)
  db: auth => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } }),
}))
