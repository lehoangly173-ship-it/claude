import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { Role } from './data';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type Account = { email: string; role: Role; staffId: string };

export async function signInWithGoogle(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
      });
      return error ? error.message : null;
    }
    const redirectTo = Linking.createURL('auth');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
    });
    if (error || !data?.url) return error?.message ?? 'Không mở được trang đăng nhập Google';
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') return null;
    const frag = res.url.split('#')[1] ?? res.url.split('?')[1] ?? '';
    const p = new URLSearchParams(frag);
    const code = new URLSearchParams(res.url.split('?')[1]?.split('#')[0] ?? '').get('code');
    if (code) {
      const r = await supabase.auth.exchangeCodeForSession(code);
      return r.error ? r.error.message : null;
    }
    const at = p.get('access_token'); const rt = p.get('refresh_token');
    if (at && rt) {
      const r = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
      return r.error ? r.error.message : null;
    }
    return 'Không nhận được phiên đăng nhập';
  } catch (e: any) {
    return e?.message ?? 'Lỗi đăng nhập';
  }
}

// Tìm vai trò của email trong danh sách nhân viên được cấp quyền.
export async function loadAccount(): Promise<{ email: string | null; account: Account | null }> {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email ?? null;
  if (!email) return { email: null, account: null };
  const { data: row } = await supabase.from('staff_accounts').select('email, role, staff_id').maybeSingle();
  if (!row) return { email, account: null };
  return { email, account: { email, role: row.role as Role, staffId: row.staff_id } };
}

// Số điện thoại được đổi thành email nội bộ (không cần gửi SMS). Email thật giữ nguyên.
export function toLoginEmail(input: string): string {
  const v = input.trim().toLowerCase();
  if (v.includes('@')) return v;
  return `${v.replace(/\D/g, '')}@phone.homespa.vn`;
}
