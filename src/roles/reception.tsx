import React, { useState } from 'react';
import { View } from 'react-native';
import { Tier, TODAY } from '../data';
import { AssignSheet, BedMap, BookingSheet, Cashier, CustomerSheet, KtvBoard, NewBookingSheet, Schedule, WaitingCard } from '../shared';
import { alerts, careList, endOf, hhmm, metrics, money, staffById, useApp } from '../store';
import { C } from '../theme';
import { AlertList, Btn, Card, Empty, Field, Grid, Pill, Row, Screen, Section, Seg, Stat, Title, Txt } from '../ui';
import { MePanel, Nav } from './common';

export type RecSub = 'queue' | 'schedule' | 'beds' | 'cashier';

export function Reception({ nav }: { nav: Nav }) {
  const s = useApp();
  const [assign, setAssign] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [booking, setBooking] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const m = metrics(s);
  const goWork = (sub?: string) => { nav.setSub((sub as RecSub) ?? 'queue'); nav.setTab(1); };
  const greet = s.now < 11 * 60 ? 'Chào buổi sáng' : s.now < 18 * 60 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const sheets = (
    <>
      <AssignSheet bookingId={assign} onClose={() => setAssign(null)} />
      <CustomerSheet id={profile} role="reception" onClose={() => setProfile(null)} />
      <BookingSheet id={booking} onClose={() => setBooking(null)} onAssign={setAssign} />
      <NewBookingSheet visible={newOpen} onClose={() => setNewOpen(false)} />
    </>
  );

  if (nav.tab === 0) {
    return (
      <Screen>
        <Title kicker="Điều phối hôm nay" title={`${greet}, ${staffById(nav.staffId)?.name}`} sub={`${TODAY.label} · Home Spa Đà Nẵng`}
          right={<Btn small kind="primary" label="+ Tạo lịch" onPress={() => setNewOpen(true)} />} />
        <Grid>
          <Stat label="KTV trong ca" value={m.ktvInShift} t="green" chips={[{ label: `${m.ktvBusy} đang làm`, t: 'green' }, { label: `${m.ktvFree} rảnh`, t: 'gray' }]} onPress={() => goWork('queue')} />
          <Stat label="Sắp hoàn thành" value={m.soon.length} sub="Trong 30 phút tới" t="amber"
            chips={m.soon[0] ? [{ label: `Xong lúc ${hhmm(endOf(m.soon[0]))}`, t: 'amber' }] : undefined} onPress={() => goWork('beds')} />
          <Stat label="Giường sử dụng" value={`${m.bedsUsed}/${m.bedsTotal}`} sub={`${m.bedsFree} trống · ${m.bedsCleaning} đang dọn`} t="green" onPress={() => goWork('beds')} />
          <Stat label="Khách đang chờ" value={m.waiting.length} sub="Chưa phân KTV" t="purple"
            chips={m.waitingLong.length ? [{ label: `⚠ ${m.waitingLong.length} chờ quá 10 phút`, t: 'red' }] : undefined} onPress={() => goWork('queue')} />
          <Stat label="Lịch hẹn hôm nay" value={m.todayTotal} sub={`${m.doneCount} đã xong · ${m.remaining} còn lại`} t="purple" onPress={() => goWork('schedule')} />
          <Stat label="Tiền đã thu hôm nay" value={money(m.revenuePaid)} sub={`${m.paid.length} hóa đơn · chờ thu ${m.unpaid.length}`} t="tan" onPress={() => goWork('cashier')} />
        </Grid>
        <Section title="Việc cần xử lý ngay"><AlertList items={alerts(s)} onGo={goWork} /></Section>
        <Section title="Thao tác nhanh">
          <Grid>
            <Btn label="+ Tạo lịch" onPress={() => setNewOpen(true)} style={{ flex: 1, minWidth: 140 }} />
            <Btn kind="gold" label="⚡ Chia tour" onPress={() => goWork('queue')} style={{ flex: 1, minWidth: 140 }} />
            <Btn kind="soft" label="💳 Thu ngân" onPress={() => goWork('cashier')} style={{ flex: 1, minWidth: 140 }} />
            <Btn kind="soft" label="🛏 Sơ đồ giường" onPress={() => goWork('beds')} style={{ flex: 1, minWidth: 140 }} />
          </Grid>
        </Section>
        {sheets}
      </Screen>
    );
  }

  if (nav.tab === 1) {
    const sub = (nav.sub as RecSub) || 'queue';
    return (
      <Screen>
        <Title kicker="Lễ tân" title="Điều phối" />
        <Seg value={sub} onChange={(v) => nav.setSub(v)} options={[
          { v: 'queue', label: 'Hàng chờ', badge: m.waiting.length },
          { v: 'schedule', label: 'Lịch' },
          { v: 'beds', label: 'Giường' },
          { v: 'cashier', label: 'Thu ngân', badge: m.unpaid.length },
        ]} />
        {sub === 'queue' ? (
          <>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              <Pill big t="amber" label={`${m.waiting.length} đang chờ`} />
              <Pill big t="blue" label={`${m.ktvFree} KTV rảnh`} />
              <Pill big t="tan" label={`${m.soon.length} sắp xong`} />
            </Row>
            <Section title={`Khách đang chờ · ${m.waiting.length} người`} right={<Btn small kind="ghost" label="+ Thêm khách" onPress={() => setNewOpen(true)} />}>
              {m.waiting.length
                ? [...m.waiting].sort((a, b) => (a.arrivedAt ?? 0) - (b.arrivedAt ?? 0)).map((b) => <WaitingCard key={b.id} b={b} onAssign={() => setAssign(b.id)} onProfile={() => setProfile(b.customerId)} />)
                : <Empty text="Không có khách đang chờ" />}
            </Section>
            <KtvBoard />
          </>
        ) : null}
        {sub === 'schedule' ? <Schedule onOpenBooking={setBooking} /> : null}
        {sub === 'beds' ? <BedMap role="reception" /> : null}
        {sub === 'cashier' ? <Cashier /> : null}
        {sheets}
      </Screen>
    );
  }

  if (nav.tab === 2) return <CustomersTab onOpen={setProfile} sheets={sheets} />;

  return <Screen><MePanel staffId={nav.staffId} role="reception" /></Screen>;
}

function CustomersTab({ onOpen, sheets }: { onOpen: (id: string) => void; sheets: React.ReactNode }) {
  const s = useApp();
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState<'all' | Tier | 'care'>('all');
  const care = careList(s);
  const list = s.customers
    .filter((c) => seg === 'all' || seg === 'care' || c.tier === seg)
    .filter((c) => !q || (c.name + c.phone + c.id).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.lastVisitDaysAgo - a.lastVisitDaysAgo);
  return (
    <Screen>
      <Title kicker="Lễ tân" title="Khách hàng" sub={`${s.customers.length} hồ sơ · chỉ Lễ tân thấy số điện thoại`} />
      <Field label="Tìm khách" value={q} onChangeText={setQ} placeholder="Tên, số điện thoại, mã KH" />
      <Seg value={seg} onChange={setSeg} options={[
        { v: 'all', label: 'Tất cả' }, { v: 'care', label: 'Cần CSKH', badge: care.length }, { v: 'VIP', label: 'VIP' },
        { v: 'Thành viên', label: 'Thành viên' }, { v: 'Khách mới', label: 'Khách mới' }, { v: 'Khách NN', label: 'Khách NN' },
      ]} />
      {seg === 'care' ? (
        care.length ? care.map((x) => (
          <Card key={x.customer.id + x.kind} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}><Txt weight="800">{x.customer.name}</Txt><Pill label={x.reason} t={x.tone} /></Row>
            <Txt size={12} color={C.sub}>{x.customer.phone} · {x.customer.tier} · {x.customer.source}</Txt>
            <Row><Btn small kind="ghost" label="Hồ sơ" onPress={() => onOpen(x.customer.id)} style={{ flex: 1 }} /><Btn small label="✓ Đã liên hệ" onPress={() => s.logCare(x.customer.id, x.kind)} style={{ flex: 1 }} /></Row>
          </Card>
        )) : <Empty text="Đã chăm sóc hết danh sách hôm nay" />
      ) : (
        <Card style={{ padding: 0 }}>
          {list.map((c, i) => (
            <View key={c.id} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <Row gap={10} style={{ padding: 12 }}>
                <View style={{ flex: 1 }}>
                  <Txt weight="700">{c.name} <Txt size={11} color={C.sub}>{c.id}</Txt></Txt>
                  <Txt size={12} color={C.sub}>{c.phone} · {c.lastVisitDaysAgo === 0 ? 'Hôm nay' : `${c.lastVisitDaysAgo} ngày trước`} · {c.visits} lần</Txt>
                </View>
                <Pill label={c.tier} t={c.tier === 'VIP' ? 'gold' : c.tier === 'Khách mới' ? 'blue' : c.tier === 'Khách NN' ? 'purple' : 'green'} />
                <Btn small kind="ghost" label="Mở" onPress={() => onOpen(c.id)} />
              </Row>
            </View>
          ))}
        </Card>
      )}
      {sheets}
    </Screen>
  );
}
