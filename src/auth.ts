import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { Role } from './data';
import { Perm } from './perms';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();


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

export type MemberStatus = 'pending' | 'active' | 'rejected' | 'disabled';
export type Member = {
  user_id: string; email: string; full_name: string; status: MemberStatus;
  requested_role: Role | null; note: string | null; role: Role | null; staff_id: string | null;
  permissions: Perm[]; is_owner: boolean; requested_at: string; decided_at: string | null;
};

// Đọc hồ sơ thành viên của người đang đăng nhập. Chủ spa đăng nhập lần đầu sẽ tự thành CEO.
export async function loadMember(): Promise<{ email: string | null; name: string; member: Member | null; error?: string }> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return { email: null, name: '', member: null };
  const email = user.email ?? null;
  const name = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '';
  const { data: row, error } = await supabase.from('members').select('*').eq('user_id', user.id).maybeSingle();
  if (error) return { email, name, member: null, error: error.message };
  if (row) return { email, name, member: row as Member };
  const { data: owner } = await supabase.rpc('claim_owner');
  return { email, name, member: owner && (owner as Member).user_id ? (owner as Member) : null };
}

export async function requestAccess(fullName: string, role: Role, note: string) {
  const { data, error } = await supabase.rpc('request_access', { p_full_name: fullName, p_role: role, p_note: note });
  return { member: (data as Member) ?? null, error: error?.message ?? null };
}

export async function listMembers() {
  const { data, error } = await supabase.from('members').select('*').order('requested_at', { ascending: false });
  return { members: (data as Member[]) ?? [], error: error?.message ?? null };
}

export async function setMember(userId: string, status: 'active' | 'rejected' | 'disabled', role: Role | null, perms: Perm[], staffId: string | null) {
  const { data, error } = await supabase.rpc('ceo_set_member', {
    p_user: userId, p_status: status, p_role: role, p_permissions: perms, p_staff_id: staffId,
  });
  return { member: (data as Member) ?? null, error: error?.message ?? null };
}

// Số điện thoại được đổi thành email nội bộ (không cần gửi SMS). Email thật giữ nguyên.
export function toLoginEmail(input: string): string {
  const v = input.trim().toLowerCase();
  if (v.includes('@')) return v;
  return `${v.replace(/\D/g, '')}@phone.homespa.vn`;
}

// ---- Đăng nhập Google trên web bằng Google Identity Services (chỉ cần Client ID, không cần Client Secret)
export const GOOGLE_CLIENT_ID = '963363717956-nhjlmvjd7p3i162omgvu0k6v19d8qnsg.apps.googleusercontent.com';

function loadGis(): Promise<void> {
  const w = window as any;
  if (w.google?.accounts?.id) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error('Không tải được Google'));
    document.head.appendChild(s);
  });
}

async function sha256hex(v: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Vẽ nút Google thật (trong suốt) chồng lên nút thiết kế; bấm vào là mở cửa sổ chọn tài khoản Google.
export async function mountGoogleButton(el: HTMLElement, onResult: (err: string | null) => void) {
  try {
    await loadGis();
    const raw = (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Math.random()).slice(2) + Date.now();
    const hashed = await sha256hex(raw);
    const g = (window as any).google.accounts.id;
    g.initialize({
      client_id: GOOGLE_CLIENT_ID,
      nonce: hashed,
      ux_mode: 'popup',
      callback: async (r: { credential: string }) => {
        const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: r.credential, nonce: raw });
        onResult(error ? error.message : null);
      },
    });
    el.innerHTML = '';
    g.renderButton(el, { type: 'standard', size: 'large', shape: 'pill', text: 'signin_with', width: Math.min(400, Math.max(200, el.offsetWidth)) });
  } catch (e: any) {
    onResult(e?.message ?? 'Không tải được Google');
  }
}
