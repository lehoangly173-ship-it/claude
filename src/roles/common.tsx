import { supabase } from '../supabase';
import React from 'react';
import { View } from 'react-native';
import { Role, SHIFTS } from '../data';
import { PERM_INFO } from '../perms';
import { hhmm, staffById, useApp } from '../store';
import { C } from '../theme';
import { Avatar, Bar, Btn, Card, Pill, Row, Section, Title, Txt } from '../ui';

export type Nav = { tab: number; setTab: (t: number) => void; sub: string; setSub: (s: string) => void; staffId: string; pendingN?: number };

export const ROLE_LABEL: Record<Role, string> = { reception: 'Lễ tân', ktv: 'Kỹ thuật viên', ceo: 'CEO', marketing: 'Marketing · CSKH', leader: 'Leader · Quản lý ca' };

const RECEPTION_TABS = [{ label: 'Hôm nay', icon: '◉' }, { label: 'Điều phối', icon: '▦' }, { label: 'Khách hàng', icon: '☺' }, { label: 'Của tôi', icon: '◎' }];
export const TABS: Record<Role, { label: string; icon: string }[]> = {
  reception: RECEPTION_TABS,
  leader: RECEPTION_TABS,
  ktv: [{ label: 'Hôm nay', icon: '◉' }, { label: 'Công việc', icon: '✓' }, { label: 'Khách hàng', icon: '☺' }, { label: 'Của tôi', icon: '◎' }],
  ceo: [{ label: 'Hôm nay', icon: '◉' }, { label: 'Kinh doanh', icon: '▤' }, { label: 'Nhân sự', icon: '☺' }, { label: 'Của tôi', icon: '◎' }],
  marketing: [{ label: 'Hôm nay', icon: '◉' }, { label: 'Nội dung', icon: '▶' }, { label: 'Khách hàng', icon: '☺' }, { label: 'Của tôi', icon: '◎' }],
};

// Màn hình dùng khi tài khoản không được cấp tính năng đó
export function NoAccess({ what }: { what: string }) {
  return (
    <Card style={{ gap: 6, alignItems: 'center', paddingVertical: 28 }}>
      <Txt size={28}>🔒</Txt>
      <Txt weight="800">Chưa được cấp quyền</Txt>
      <Txt size={13} color={C.sub} style={{ textAlign: 'center' }}>Bạn chưa có quyền “{what}”. Nhờ CEO bật quyền này trong mục Nhân sự.</Txt>
    </Card>
  );
}

export function MePanel({ staffId, role, extra }: { staffId: string; role: Role; extra?: React.ReactNode }) {
  const s = useApp();
  const me = staffById(staffId)!;
  const inAt = s.checkins[staffId];
  const doneTr = me.training.filter((t) => t.done).length;
  return (
    <>
      <Title kicker="Của tôi" title={me.name} sub={`${ROLE_LABEL[role]} · ${SHIFTS[me.shift].name} ${hhmm(SHIFTS[me.shift].start)}–${hhmm(SHIFTS[me.shift].end)}`} />
      <Card style={{ gap: 10 }}>
        <Row gap={12}>
          <Avatar name={me.name} color={me.color} size={48} />
          <View style={{ flex: 1 }}>
            <Txt weight="800" size={16}>{me.name}</Txt>
            <Txt size={13} color={C.sub}>Home Spa Đà Nẵng</Txt>
          </View>
          {inAt ? <Pill big t="green" label={`Vào ca ${hhmm(inAt)}`} /> : <Btn small label="Chấm công vào ca" onPress={() => s.staffCheckIn(staffId)} />}
        </Row>
      </Card>
      {extra}
      {me.training.length ? (
        <Section title={`Đào tạo · ${doneTr}/${me.training.length} bài`}>
          <Card style={{ gap: 8 }}>
            <Bar pct={(doneTr / me.training.length) * 100} />
            {me.training.map((t) => <Txt key={t.title} size={13} color={t.done ? C.sub : C.ink}>{t.done ? '✓' : '○'}  {t.title}</Txt>)}
          </Card>
        </Section>
      ) : null}
      <Section title="Quyền của tôi (do CEO cấp)">
        <Card style={{ gap: 4 }}>
          {PERM_INFO.map((p) => {
            const on = !!s.session?.perms.includes(p.key);
            return <Txt key={p.key} size={13} color={on ? C.ink : C.faint}>{on ? '✓' : '—'}  {p.label}</Txt>;
          })}
        </Card>
      </Section>
      <Section title="Tài khoản">
        <Card style={{ gap: 8 }}>
          <Txt size={13} color={C.sub}>Số liệu lịch hẹn, khách, doanh thu hiện vẫn là dữ liệu mẫu. Đồng hồ demo bắt đầu 10:15 — bấm “+15p” để tua giờ.</Txt>
          <Row>
            <Btn kind="soft" small label="Đặt lại dữ liệu mẫu" onPress={s.reset} style={{ flex: 1 }} />
            <Btn kind="danger" small label="Đăng xuất" onPress={() => { void supabase.auth.signOut(); s.logout(); }} style={{ flex: 1 }} />
          </Row>
        </Card>
      </Section>
    </>
  );
}
