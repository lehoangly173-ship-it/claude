import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { listMembers, Member, setMember } from '../auth';
import { Role, STAFF } from '../data';
import { DEFAULT_PERMS, Perm, PERM_INFO, ROLE_OPTIONS, ROLE_PERMS } from '../perms';
import { useApp } from '../store';
import { C } from '../theme';
import { Btn, Card, Check, Choice, Empty, Pill, Row, Section, Sheet, Txt } from '../ui';
import { ROLE_LABEL } from './common';

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} phút trước` : m < 1440 ? `${Math.round(m / 60)} giờ trước` : `${Math.round(m / 1440)} ngày trước`;
};

// Số yêu cầu đang chờ — dùng cho huy hiệu trên thanh tab và thẻ cảnh báo của CEO
export function usePendingCount(enabled: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = async () => { const r = await listMembers(); if (alive) setN(r.members.filter((m) => m.status === 'pending').length); };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [enabled]);
  return n;
}

export function StaffAdmin() {
  const say = useApp((s) => s.say);
  const myStaffId = useApp((s) => s.session?.staffId);
  const [members, setMembers] = useState<Member[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Member | null>(null);
  const [showOld, setShowOld] = useState(false);

  const load = useCallback(async () => {
    const r = await listMembers();
    setMembers(r.members); setErr(r.error); setLoading(false);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const pending = members.filter((m) => m.status === 'pending');
  const active = members.filter((m) => m.status === 'active');
  const old = members.filter((m) => m.status === 'rejected' || m.status === 'disabled');

  const reject = async (m: Member) => {
    const r = await setMember(m.user_id, 'rejected', null, [], null);
    if (r.error) setErr(r.error); else { say(`Đã từ chối ${m.full_name || m.email}`); load(); }
  };

  return (
    <>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Pill big t={pending.length ? 'amber' : 'gray'} label={`${pending.length} chờ duyệt`} />
        <Pill big t="green" label={`${active.length} đang hoạt động`} />
        <Btn small kind="ghost" label="↻ Tải lại" onPress={load} />
      </Row>
      {err ? <Card accent={C.red}><Txt size={13} color={C.red}>{err}</Txt></Card> : null}

      <Section title={`Yêu cầu tham gia · ${pending.length}`}>
        {loading ? <Empty text="Đang tải…" /> : pending.length ? pending.map((m) => (
          <Card key={m.user_id} accent={C.gold} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt weight="800">{m.full_name || m.email}</Txt>
              <Txt size={11} color={C.sub}>{ago(m.requested_at)}</Txt>
            </Row>
            <Txt size={12} color={C.sub}>{m.email}</Txt>
            <Txt size={13}>Xin làm: <Txt weight="700">{m.requested_role ? ROLE_LABEL[m.requested_role] : 'chưa chọn'}</Txt></Txt>
            {m.note ? <Txt size={13} color={C.tan}>“{m.note}”</Txt> : null}
            <Row>
              <Btn small kind="danger" label="Từ chối" onPress={() => reject(m)} style={{ flex: 1 }} />
              <Btn small label="Duyệt & cấp quyền" onPress={() => setEdit(m)} style={{ flex: 1.4 }} />
            </Row>
          </Card>
        )) : <Empty text="Không có yêu cầu mới" />}
      </Section>

      <Section title={`Nhân sự đang dùng app · ${active.length}`}>
        {active.map((m) => (
          <Card key={m.user_id} onPress={() => setEdit(m)} style={{ gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt weight="800">{m.full_name || m.email}{m.is_owner ? '  👑' : ''}</Txt>
              <Pill label={m.role ? ROLE_LABEL[m.role] : '—'} t={m.role === 'ceo' ? 'gold' : 'green'} />
            </Row>
            <Txt size={12} color={C.sub}>{m.email} · {m.permissions.length}/{PERM_INFO.length} tính năng · hồ sơ {STAFF.find((x) => x.id === m.staff_id)?.name ?? 'chưa gắn'}</Txt>
          </Card>
        ))}
      </Section>

      {old.length ? (
        <Section title={`Đã khóa / từ chối · ${old.length}`} right={<Btn small kind="ghost" label={showOld ? 'Ẩn' : 'Xem'} onPress={() => setShowOld(!showOld)} />}>
          {showOld ? old.map((m) => (
            <Card key={m.user_id} onPress={() => setEdit(m)} style={{ gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt weight="700">{m.full_name || m.email}</Txt>
                <Pill label={m.status === 'disabled' ? 'Đã khóa' : 'Đã từ chối'} t="red" />
              </Row>
              <Txt size={12} color={C.sub}>{m.email}</Txt>
            </Card>
          )) : null}
        </Section>
      ) : null}

      <MemberEditor member={edit} members={members} selfStaffId={myStaffId} onClose={() => setEdit(null)} onSaved={(msg) => { say(msg); setEdit(null); load(); }} />
    </>
  );
}

function MemberEditor({ member, members, selfStaffId, onClose, onSaved }: {
  member: Member | null; members: Member[]; selfStaffId?: string; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [role, setRole] = useState<Role>('reception');
  const [perms, setPerms] = useState<Perm[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!member) return;
    const r: Role = member.role ?? member.requested_role ?? 'reception';
    setRole(r);
    setPerms(member.status === 'active' && member.role === r ? member.permissions : DEFAULT_PERMS[r]);
    setStaffId(member.staff_id ?? suggestStaff(r, members, member.user_id));
    setErr(null);
  }, [member?.user_id]);

  if (!member) return null;
  const name = member.full_name || member.email;
  const changeRole = (r: Role) => { setRole(r); setPerms(DEFAULT_PERMS[r]); setStaffId(suggestStaff(r, members, member.user_id)); };
  const toggle = (p: Perm) => setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  const profiles = STAFF.filter((x) => x.role === role);
  const usedBy = (sid: string) => members.find((m) => m.user_id !== member.user_id && m.status === 'active' && m.staff_id === sid);

  const save = async (status: 'active' | 'rejected' | 'disabled') => {
    setBusy(true); setErr(null);
    const r = await setMember(member.user_id, status, status === 'active' ? role : null, role === 'ceo' ? DEFAULT_PERMS.ceo : perms, status === 'active' ? staffId : null);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    onSaved(status === 'active' ? (member.status === 'pending' ? `Đã duyệt ${name} · ${ROLE_LABEL[role]}` : `Đã cập nhật quyền cho ${name}`)
      : status === 'disabled' ? `Đã khóa tài khoản ${name}` : `Đã từ chối ${name}`);
  };

  return (
    <Sheet visible onClose={onClose} title={member.status === 'pending' ? `Duyệt: ${name}` : name}>
      <Txt size={12} color={C.sub}>{member.email}{member.note ? ` · “${member.note}”` : ''}</Txt>
      {member.is_owner ? <Card><Txt size={13}>👑 Tài khoản chủ spa — luôn là CEO, không thể khóa hay hạ quyền.</Txt></Card> : (
        <>
          <Choice label="Vai trò" value={role} onChange={changeRole}
            options={ROLE_OPTIONS.map((o) => ({ v: o.v, label: o.label, sub: o.desc }))} />
          {role !== 'ceo' ? (
            <Choice label="Gắn với hồ sơ nhân viên trong app" value={staffId ?? undefined} onChange={(v) => setStaffId(v)}
              options={profiles.map((p) => { const u = usedBy(p.id); return { v: p.id, label: p.name, sub: u ? `đang gắn với ${u.full_name || u.email}` : p.shift === 'ca1' ? 'Ca 1' : 'Ca 2' }; })} />
          ) : null}
          <View style={{ gap: 2 }}>
            <Txt size={12} color={C.sub} weight="600">Tính năng được dùng</Txt>
            {role === 'ceo' ? <Txt size={13}>CEO luôn có đủ mọi tính năng.</Txt> : ROLE_PERMS[role].map((k) => {
              const info = PERM_INFO.find((x) => x.key === k)!;
              return <Check key={k} on={perms.includes(k)} label={info.label} sub={info.desc} onPress={() => toggle(k)} />;
            })}
          </View>
        </>
      )}
      {err ? <Txt size={13} color={C.red}>{err}</Txt> : null}
      {!member.is_owner ? (
        <Row>
          {member.status === 'pending' ? <Btn kind="danger" label="Từ chối" disabled={busy} onPress={() => save('rejected')} style={{ flex: 1 }} /> : null}
          {member.status === 'active' ? <Btn kind="danger" label="Khóa" disabled={busy} onPress={() => save('disabled')} style={{ flex: 1 }} /> : null}
          <Btn label={busy ? 'Đang lưu…' : member.status === 'pending' ? 'Duyệt' : member.status === 'active' ? 'Lưu' : 'Mở lại & cấp quyền'}
            disabled={busy || (role !== 'ceo' && !staffId)} onPress={() => save('active')} style={{ flex: 1.5 }} />
        </Row>
      ) : null}
      {role !== 'ceo' && !staffId && !member.is_owner ? <Txt size={12} color={C.sub}>Chọn một hồ sơ nhân viên để bật nút duyệt.</Txt> : null}
    </Sheet>
  );
}

// Gợi ý hồ sơ chưa ai dùng cho vai trò đó
function suggestStaff(role: Role, members: Member[], self: string): string | null {
  if (role === 'ceo') return 'quyen';
  const used = new Set(members.filter((m) => m.user_id !== self && m.status === 'active').map((m) => m.staff_id));
  const list = STAFF.filter((x) => x.role === role);
  return (list.find((x) => !used.has(x.id)) ?? list[0])?.id ?? null;
}
