import { supabase } from '../supabase';
import React from 'react';
import { View } from 'react-native';
import { Role, SHIFTS } from '../data';
import { hhmm, staffById, useApp } from '../store';
import { C } from '../theme';
import { Avatar, Bar, Btn, Card, Pill, Row, Section, Title, Txt } from '../ui';

export type Nav = { tab: number; setTab: (t: number) => void; sub: string; setSub: (s: string) => void; staffId: string };

export const ROLE_LABEL: Record<Role, string> = { reception: 'Lễ tân', ktv: 'Kỹ thuật viên', ceo: 'CEO', marketing: 'Marketing · CSKH' };

export const TABS: Record<Role, { label: string; icon: string }[]> = {
  reception: [{ label: 'Hôm nay', icon: '◉' }, { label: 'Điều phối', icon: '▦' }, { label: 'Khách hàng', icon: '☺' }, { label: 'Của tôi', icon: '◎' }],
  ktv: [{ label: 'Hôm nay', icon: '◉' }, { label: 'Công việc', icon: '✓' }, { label: 'Khách hàng', icon: '☺' }, { label: 'Của tôi', icon: '◎' }],
  ceo: [{ label: 'Hôm nay', icon: '◉' }, { label: 'Kinh doanh', icon: '▤' }, { label: 'Khách hàng', icon: '☺' }, { label: 'Của tôi', icon: '◎' }],
  marketing: [{ label: 'Hôm nay', icon: '◉' }, { label: 'Nội dung', icon: '▶' }, { label: 'Khách hàng', icon: '☺' }, { label: 'Của tôi', icon: '◎' }],
};

const PERMS: Record<Role, string[]> = {
  reception: ['Xem & sửa lịch hẹn, chia tour, thu ngân', 'Là vai trò DUY NHẤT thấy số điện thoại khách', 'Không xem lợi nhuận, lương'],
  ktv: ['Xem việc, tour và khách của mình', 'Không thấy số điện thoại khách', 'Chỉ xem thu nhập — không sửa được'],
  ceo: ['Xem toàn bộ số liệu kinh doanh', 'Chỉ can thiệp khi vượt hạn mức', 'Số điện thoại khách vẫn ẩn'],
  marketing: ['Xem phễu kênh, CSKH, nội dung', 'Không thấy số điện thoại khách', 'Nội dung cần duyệt trước khi đăng'],
};

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
      <Section title="Quyền của tôi">
        <Card style={{ gap: 4 }}>{PERMS[role].map((p) => <Txt key={p} size={13}>• {p}</Txt>)}</Card>
      </Section>
      <Section title="Bản demo">
        <Card style={{ gap: 8 }}>
          <Txt size={13} color={C.sub}>Đồng hồ demo bắt đầu 10:15. Bấm “+15p” trên thanh trên cùng để tua giờ và xem số liệu thay đổi.</Txt>
          <Row>
            <Btn kind="soft" small label="Đặt lại dữ liệu mẫu" onPress={s.reset} style={{ flex: 1 }} />
            <Btn kind="danger" small label="Đăng xuất / đổi vai" onPress={() => { void supabase.auth.signOut(); s.logout(); }} style={{ flex: 1 }} />
          </Row>
        </Card>
      </Section>
    </>
  );
}
