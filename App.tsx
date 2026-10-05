import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Role, STAFF } from './src/data';
import { Ceo } from './src/roles/ceo';
import { Nav, ROLE_LABEL, TABS } from './src/roles/common';
import { Ktv } from './src/roles/ktv';
import { Marketing } from './src/roles/marketing';
import { Reception } from './src/roles/reception';
import { alerts, hhmm, metrics, staffById, useApp } from './src/store';
import { C } from './src/theme';
import { Avatar, Btn, Card, Row, Txt } from './src/ui';
import { loadAccount, mountGoogleButton, signInWithGoogle, toLoginEmail } from './src/auth';
import { supabase } from './src/supabase';

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

const ALLOW_DEMO = true; // nút "xem thử" không cần đăng nhập — tắt khi chạy thật

function Root() {
  const session = useApp((s) => s.session);
  const login = useApp((s) => s.login);
  const [state, setState] = useState<'loading' | 'out' | 'denied'>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      const r = await loadAccount();
      if (!alive) return;
      setEmail(r.email);
      if (r.account) login(r.account.role, r.account.staffId);
      else setState(r.email ? 'denied' : 'out');
    };
    sync();
    const { data } = supabase.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') sync(); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  if (session) return <><StatusBar style="light" /><Shell role={session.role} staffId={session.staffId} key={session.staffId} /></>;
  if (state === 'loading') return <SafeAreaView style={{ flex: 1, backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center' }}><Txt color="#fff">Đang tải…</Txt></SafeAreaView>;
  return <><StatusBar style="dark" /><Login denied={state === 'denied' ? email : null} /></>;
}

function Login({ denied }: { denied: string | null }) {
  const login = useApp((s) => s.login);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [signup, setSignup] = useState(false);
  const roles: { r: Role; d: string; icon: string }[] = [
    { r: 'reception', d: 'Điều phối, chia tour, sơ đồ giường, thu ngân', icon: '🛎' },
    { r: 'ktv', d: 'Việc tiếp theo, tour hôm nay, checklist', icon: '💆' },
    { r: 'ceo', d: 'Sức khỏe kinh doanh, cảnh báo, ưu tiên', icon: '📈' },
    { r: 'marketing', d: 'Nội dung mỗi ngày, phễu kênh, CSKH', icon: '📣' },
  ];
  const people = STAFF.filter((s) => s.role === role);
  const GREEN = '#17703F';
  const submit = async () => {
    setErr(null); setInfo(null);
    if (!id.trim() || pw.length < 6) { setErr('Nhập số điện thoại/email và mật khẩu (từ 6 ký tự).'); return; }
    setBusy(true);
    const email = toLoginEmail(id);
    if (signup) {
      const { data, error } = await supabase.auth.signUp({ email, password: pw });
      if (error) setErr(error.message);
      else if (!data.session) setInfo('Đã đăng ký. Hãy kiểm tra email để xác nhận rồi đăng nhập.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setErr(error.message.includes('Invalid') ? 'Sai tài khoản hoặc mật khẩu.' : error.message);
    }
    setBusy(false);
  };
  if (!demo) return (
    <LoginArt
      id={id} setId={setId} pw={pw} setPw={setPw} show={show} setShow={setShow} busy={busy} signup={signup}
      msg={err ?? info} msgErr={!!err} denied={denied}
      onSubmit={submit}
      onGoogle={async () => { setBusy(true); setErr(null); if (denied) await supabase.auth.signOut(); setErr(await signInWithGoogle()); setBusy(false); }}
      onGoogleResult={(e) => setErr(e)}
      onToggleSignup={() => { setSignup(!signup); setErr(null); setInfo(null); }}
      onDemo={ALLOW_DEMO ? () => setDemo(true) : undefined}
    />
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F5EE' }}>
      <ScrollView contentContainerStyle={{ padding: 26, gap: 14, maxWidth: 480, width: '100%', alignSelf: 'center', flexGrow: 1, justifyContent: 'center' }}>
        {false ? (
          <View />
        ) : (
          <>
            <Txt size={12} weight="700" color="#4A6B57" style={{ letterSpacing: 1 }}>{role ? 'CHỌN NGƯỜI ĐĂNG NHẬP' : 'DEMO · CHỌN VAI TRÒ'}</Txt>
            {!role ? [...roles.map((x) => (
              <Card key={x.r} onPress={() => setRole(x.r)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Txt size={26}>{x.icon}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt weight="800" size={16}>{ROLE_LABEL[x.r]}</Txt>
                  <Txt size={12} color={C.sub}>{x.d}</Txt>
                </View>
                <Txt color={C.faint} size={18}>›</Txt>
              </Card>
            )), <Pressable key="back" onPress={() => setDemo(false)}><Txt color={GREEN} weight="700">‹ Quay lại đăng nhập</Txt></Pressable>] : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {people.map((p) => (
                    <Card key={p.id} onPress={() => login(role, p.id)} style={{ width: 104, alignItems: 'center', gap: 6 }}>
                      <Avatar name={p.name} color={p.color} size={44} />
                      <Txt weight="700">{p.name}</Txt>
                      <Txt size={11} color={C.sub}>{p.shift === 'ca1' ? 'Ca 1' : 'Ca 2'}</Txt>
                    </Card>
                  ))}
                </View>
                <Pressable onPress={() => setRole(null)}><Txt color={GREEN} weight="700">‹ Chọn vai trò khác</Txt></Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Màn hình đăng nhập: nền là ảnh thiết kế gốc, ô nhập và nút thật đặt đúng toạ độ trên ảnh (1024×1536).
const ART_W = 1024, ART_H = 1536;
function LoginArt(p: {
  id: string; setId: (v: string) => void; pw: string; setPw: (v: string) => void; show: boolean; setShow: (v: boolean) => void;
  busy: boolean; signup: boolean; msg: string | null; msgErr: boolean; denied: string | null;
  onSubmit: () => void; onGoogle: () => void; onGoogleResult: (err: string | null) => void; onToggleSignup: () => void; onDemo?: () => void;
}) {
  const win = useWindowDimensions();
  const [box, setBox] = useState({ w: Math.min(win.width, 520), h: win.height });
  useEffect(() => { setBox({ w: Math.min(win.width, 520), h: win.height }); }, [win.width, win.height]);
  const k = Math.max(box.w / ART_W, box.h / ART_H);
  const ox = (box.w - ART_W * k) / 2, oy = (box.h - ART_H * k) / 2;
  const at = (x1: number, y1: number, x2: number, y2: number) => ({ position: 'absolute' as const, left: ox + x1 * k, top: oy + y1 * k, width: (x2 - x1) * k, height: (y2 - y1) * k });
  const fs = 21 * k;
  const field = { flex: 1, fontSize: fs, color: '#25302A', padding: 0, margin: 0, backgroundColor: 'transparent', outlineStyle: 'none' } as any;
  return (
    <View style={{ flex: 1, backgroundColor: '#E9EFE6', alignItems: 'center' }}>
    <View style={{ flex: 1, width: '100%', maxWidth: 520, backgroundColor: '#F4F1E8', overflow: 'hidden' }} onLayout={(e) => { const l = e.nativeEvent.layout; if (l.width && l.height) setBox({ w: l.width, h: l.height }); }}>
      {box.w ? (
        <>
          <Image source={require('./assets/login-bg.jpg')} style={{ position: 'absolute', left: ox, top: oy, width: ART_W * k, height: ART_H * k }} />
          <Pressable onLongPress={p.onDemo} delayLongPress={700} style={at(370, 120, 660, 410)} />
          <View style={[at(330, 728, 785, 776), { justifyContent: 'center' }]}>
            <TextInput value={p.id} onChangeText={p.setId} placeholder="Số điện thoại / Email" placeholderTextColor="#7A8493" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={field} />
          </View>
          <View style={[at(330, 844, 730, 892), { justifyContent: 'center' }]}>
            <TextInput value={p.pw} onChangeText={p.setPw} placeholder={p.signup ? 'Tạo mật khẩu (từ 6 ký tự)' : 'Mật khẩu'} placeholderTextColor="#7A8493" secureTextEntry={!p.show} autoCapitalize="none" onSubmitEditing={p.onSubmit} style={field} />
          </View>
          <Pressable onPress={() => p.setShow(!p.show)} style={at(730, 845, 790, 892)} />
          <Pressable onPress={p.onSubmit} disabled={p.busy} style={[at(228, 948, 796, 1038), { borderRadius: 999, backgroundColor: p.busy ? 'rgba(255,255,255,0.25)' : 'transparent' }]} />
          {p.signup ? (
            <View pointerEvents="none" style={[at(330, 955, 694, 1031), { alignItems: 'center', justifyContent: 'center', backgroundColor: '#24774A', borderRadius: 30 * k }]}>
              <Text style={{ color: '#fff', fontSize: 30 * k, fontWeight: '600' }}>Đăng ký  →</Text>
            </View>
          ) : null}
          {p.msg ? (
            <View pointerEvents="none" style={[at(240, 1066, 784, 1112), { alignItems: 'center', justifyContent: 'center' }]}>
              <View style={{ backgroundColor: p.msgErr ? '#FBE9E6' : '#E6F2EA', borderRadius: 999, paddingHorizontal: 14 * k, paddingVertical: 6 * k }}>
                <Text numberOfLines={2} style={{ color: p.msgErr ? '#B3261E' : '#17703F', fontSize: 17 * k, textAlign: 'center', fontWeight: '600' }}>{p.msg}</Text>
              </View>
            </View>
          ) : null}
          {Platform.OS === 'web' ? (
            <View style={[at(249, 1126, 775, 1207), { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 999 }]}>
              <GoogleWebButton width={(775 - 249) * k} onResult={p.onGoogleResult} />
            </View>
          ) : (
            <Pressable onPress={p.onGoogle} disabled={p.busy} style={[at(249, 1126, 775, 1207), { borderRadius: 999 }]} />
          )}
          <Pressable onPress={p.onToggleSignup} style={at(520, 1236, 690, 1278)} />
          {p.signup ? (
            <View pointerEvents="none" style={[at(330, 1236, 700, 1278), { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F1E9' }]}>
              <Text style={{ fontSize: 19 * k, color: '#4A6B57' }}>Đã có tài khoản?  <Text style={{ color: '#17703F', fontWeight: '700', textDecorationLine: 'underline' }}>Đăng nhập</Text> →</Text>
            </View>
          ) : null}
          {p.denied ? (
            <View style={[at(150, 560, 874, 700), { justifyContent: 'center' }]}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: C.red, padding: 12, gap: 4 }}>
                <Txt weight="800">Tài khoản chưa được cấp quyền</Txt>
                <Txt size={12} color={C.sub}>{p.denied} chưa có trong danh sách nhân viên. Nhờ chủ spa thêm tài khoản này.</Txt>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
    </View>
  );
}

// Nút Google thật của Google, để gần như trong suốt nằm đúng chỗ nút trong ảnh thiết kế.
function GoogleWebButton({ width, onResult }: { width: number; onResult: (err: string | null) => void }) {
  const ref = React.useRef<any>(null);
  const w = Math.round(width);
  useEffect(() => { if (ref.current && w > 0) mountGoogleButton(ref.current as HTMLElement, onResult); }, [w]);
  return <View ref={ref} style={{ width: w, minHeight: 44, opacity: 0.011, transform: [{ scaleY: 1.6 }] } as any} />;
}

function Shell({ role, staffId }: { role: Role; staffId: string }) {
  const s = useApp();
  const [tab, setTab] = useState(0);
  const [sub, setSub] = useState('queue');
  const nav: Nav = { tab, setTab, sub, setSub, staffId };
  const me = staffById(staffId)!;
  const m = metrics(s);
  const badges = role === 'reception' ? [alerts(s).length, m.waiting.length + m.unpaid.length, 0, 0] : [0, 0, 0, 0];

  useEffect(() => {
    if (!s.toast) return;
    const t = setTimeout(() => s.say(null), 2200);
    return () => clearTimeout(t);
  }, [s.toast]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.forest }}>
      <Row style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
          <Txt weight="800" color={C.forest}>H</Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight="800" color="#fff">HOME SPA</Txt>
          <Txt size={11} color="#B9CBBE">{ROLE_LABEL[role]} · {me.name}</Txt>
        </View>
        <View style={{ backgroundColor: C.red, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Txt size={13} weight="800" color="#fff">{hhmm(s.now)}</Txt>
        </View>
        <Pressable onPress={() => s.tick(15)} style={{ borderWidth: 1, borderColor: '#46705A', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Txt size={12} weight="700" color="#fff">+15p ⏩</Txt>
        </Pressable>
      </Row>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
          {role === 'reception' ? <Reception nav={nav} /> : role === 'ktv' ? <Ktv nav={nav} /> : role === 'ceo' ? <Ceo nav={nav} /> : <Marketing nav={nav} />}
        </View>
        {s.toast ? (
          <View pointerEvents="none" style={{ position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ backgroundColor: C.ink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Txt color="#fff" weight="700">{s.toast}</Txt>
            </View>
          </View>
        ) : null}
      </View>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.line }}>
        <Row gap={0}>
          {TABS[role].map((t, i) => {
            const on = i === tab;
            return (
              <Pressable key={t.label} onPress={() => setTab(i)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2 }}>
                <View>
                  <Txt size={18} color={on ? C.forest : C.faint} weight="800">{t.icon}</Txt>
                  {badges[i] ? (
                    <View style={{ position: 'absolute', top: -4, right: -12, backgroundColor: C.gold, borderRadius: 999, minWidth: 16, paddingHorizontal: 4 }}>
                      <Txt size={10} weight="800" color={C.forest} style={{ textAlign: 'center' }}>{badges[i]}</Txt>
                    </View>
                  ) : null}
                </View>
                <Txt size={11} weight={on ? '800' : '600'} color={on ? C.forest : C.sub}>{t.label}</Txt>
              </Pressable>
            );
          })}
        </Row>
      </SafeAreaView>
    </SafeAreaView>
  );
}
