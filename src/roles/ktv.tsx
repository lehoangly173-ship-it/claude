import React, { useState } from 'react';
import { View } from 'react-native';
import { CLEAN_STEPS, SHIFTS } from '../data';
import { CustomerSheet, statusLabel, statusTone } from '../shared';
import { cust, endOf, hhmm, ktvStatus, staffById, svc, tourCount, useApp, vnd } from '../store';
import { C } from '../theme';
import { Btn, Card, Check, Empty, Grid, Pill, Row, Screen, Section, Stat, Title, Txt } from '../ui';
import { MePanel, Nav } from './common';

export function Ktv({ nav }: { nav: Nav }) {
  const s = useApp();
  const me = staffById(nav.staffId)!;
  const [profile, setProfile] = useState<string | null>(null);
  const mine = s.bookings.filter((b) => b.status !== 'cancelled' && (b.ktvId === me.id || (!b.ktvId && b.requestedKtvId === me.id)))
    .sort((a, b) => (a.startedAt ?? a.start) - (b.startedAt ?? b.start));
  const current = mine.find((b) => b.ktvId === me.id && (b.status === 'assigned' || b.status === 'inService'));
  const nextBooked = mine.find((b) => b.status === 'booked' || b.status === 'waiting');
  const done = mine.filter((b) => b.status === 'done');
  // Chỉ người làm CUỐI CÙNG trên giường đó mới nhận checklist dọn
  const myCleaning = done.filter((b) => b.bedId && s.cleaning[b.bedId] && !s.bookings.some((o) => o.id !== b.id && o.bedId === b.bedId && o.status === 'done' && (o.endedAt ?? 0) > (b.endedAt ?? 0)));
  const requests = mine.filter((b) => !b.ktvId);
  const st = ktvStatus(s, me.id);
  const checkedIn = !!s.checkins[me.id];
  const sheet = <CustomerSheet id={profile} role="ktv" onClose={() => setProfile(null)} />;

  if (nav.tab === 0) {
    return (
      <Screen>
        <Title kicker="Hôm nay của tôi" title={`KTV ${me.name}`} sub={`${SHIFTS[me.shift].name} · ${hhmm(SHIFTS[me.shift].start)}–${hhmm(SHIFTS[me.shift].end)}`}
          right={<Pill big label={st.label} t={st.tone} />} />
        {!checkedIn ? (
          <Card style={{ gap: 8 }} accent={C.red}>
            <Txt weight="800" size={16}>Bạn chưa vào ca</Txt>
            <Txt size={13} color={C.sub}>Chấm công để lễ tân thấy bạn trong hàng chia tour.</Txt>
            <Btn label="Chấm công vào ca" onPress={() => s.staffCheckIn(me.id)} />
          </Card>
        ) : null}
        <Section title="Việc cần làm tiếp theo">
          {current ? (
            <View style={{ backgroundColor: C.forest, borderRadius: 18, padding: 16, gap: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={28} weight="800" color={C.gold}>{hhmm(current.startedAt ?? s.now)}</Txt>
                <Pill label={current.status === 'inService' ? `Còn ${Math.max(0, endOf(current) - s.now)} phút` : 'Chuẩn bị đón khách'} t={current.status === 'inService' ? 'green' : 'gold'} />
              </Row>
              <Txt size={20} weight="800" color="#fff">{cust(s, current.customerId).name}</Txt>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                <Pill label={`${svc(current.serviceId).name} ${svc(current.serviceId).minutes}ph`} t="gold" />
                <Pill label={`Giường ${current.bedId}`} t="gold" />
                <Pill label={`Lực ${cust(s, current.customerId).pressure}`} t="gold" />
              </Row>
              {cust(s, current.customerId).note ? <Txt size={13} color="#F6D79A">📝 {cust(s, current.customerId).note}</Txt> : null}
              <Row>
                <Btn kind="ghost" label="Xem khách" onPress={() => setProfile(current.customerId)} style={{ flex: 1, borderColor: '#46705A' }} />
                {current.status === 'assigned'
                  ? <Btn kind="gold" label="▶ Bắt đầu" onPress={() => s.startService(current.id)} style={{ flex: 1.3 }} />
                  : <Btn kind="gold" label="✓ Hoàn thành" onPress={() => s.complete(current.id)} style={{ flex: 1.3 }} />}
              </Row>
            </View>
          ) : nextBooked ? (
            <Card style={{ gap: 6 }} accent={C.purple}>
              <Txt size={12} color={C.sub} weight="700">{nextBooked.status === 'waiting' ? 'KHÁCH ĐÃ ĐẾN — CHỜ LỄ TÂN CHIA TOUR' : 'LỊCH HẸN KẾ TIẾP (KHÁCH YÊU CẦU BẠN)'}</Txt>
              <Txt size={18} weight="800">{hhmm(nextBooked.start)} · {cust(s, nextBooked.customerId).name}</Txt>
              <Txt size={13} color={C.sub}>{svc(nextBooked.serviceId).name} · {svc(nextBooked.serviceId).minutes} phút{nextBooked.bedId ? ` · giường ${nextBooked.bedId}` : ''}</Txt>
              <Btn small kind="ghost" label="Xem khách" onPress={() => setProfile(nextBooked.customerId)} />
            </Card>
          ) : <Empty text="Chưa có khách — đang chờ lễ tân chia tour." />}
        </Section>
        {myCleaning.map((b) => (
          <Section key={b.id} title={`Việc sau khi phục vụ khách · ${b.bedId}`}>
            <Card>
              {CLEAN_STEPS.map((step, i) => <Check key={step} label={step} on={!!s.cleaning[b.bedId!]?.[i]} onPress={() => s.toggleClean(b.bedId!, i)} />)}
              <Txt size={12} color={C.sub}>Tick đủ 4 bước → giường tự chuyển “Trống” bên lễ tân.</Txt>
            </Card>
          </Section>
        ))}
        <Section title="Tour hôm nay">
          <Grid>
            <Stat label="Tour đã nhận" value={tourCount(s, me.id)} t="gray" />
            <Stat label="Hoàn thành" value={done.length} t="tan" />
            <Stat label="Đang làm" value={mine.filter((b) => b.status === 'inService').length} t="green" />
            <Stat label="Khách hẹn bạn" value={requests.length} sub="Chờ lễ tân chia" t="purple" />
          </Grid>
          <Card style={{ padding: 0 }}>
            {mine.length ? mine.map((b, i) => (
              <Row key={b.id} gap={10} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                <Txt weight="800" style={{ width: 46 }}>{hhmm(b.startedAt ?? b.start)}</Txt>
                <Txt style={{ flex: 1 }}>{cust(s, b.customerId).name}</Txt>
                <Pill label={statusLabel(b)} t={statusTone(b)} />
              </Row>
            )) : <View style={{ padding: 12 }}><Txt color={C.sub}>Chưa có tour</Txt></View>}
          </Card>
        </Section>
        {sheet}
      </Screen>
    );
  }

  if (nav.tab === 1) {
    const tasks = [...s.areaTasks].sort((a, b) => Number(b.assigneeId === me.id) - Number(a.assigneeId === me.id));
    const label = { todo: 'Bắt đầu', doing: 'Hoàn thành', done: 'Mở lại' };
    const tl = { todo: 'gray', doing: 'amber', done: 'green' } as const;
    return (
      <Screen>
        <Title kicker="Công việc" title="Khu vực chung" sub="Việc được giao ngoài tour — giặt sấy, dọn dẹp, checklist" />
        {tasks.map((a) => (
          <Card key={a.id} style={{ gap: 6 }} accent={a.assigneeId === me.id ? C.gold : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt weight="800">{a.title}</Txt>
              <Pill label={{ todo: 'Chưa làm', doing: 'Đang làm', done: 'Xong' }[a.status]} t={tl[a.status]} />
            </Row>
            <Txt size={13} color={C.sub}>{a.desc}</Txt>
            <Txt size={12} color={C.sub}>Người được giao: {staffById(a.assigneeId)?.name}{a.assigneeId === me.id ? ' (bạn)' : ''}</Txt>
            {a.assigneeId === me.id ? <Btn small kind={a.status === 'doing' ? 'primary' : 'soft'} label={label[a.status]} onPress={() => s.cycleArea(a.id)} /> : null}
          </Card>
        ))}
        {sheet}
      </Screen>
    );
  }

  if (nav.tab === 2) {
    const ids = [...new Set(mine.map((b) => b.customerId))];
    return (
      <Screen>
        <Title kicker="Khách của tôi hôm nay" title="Khách hàng" sub="Số điện thoại được ẩn — chỉ lễ tân xem" />
        {ids.length ? ids.map((id) => {
          const c = cust(s, id);
          return (
            <Card key={id} style={{ gap: 6 }} onPress={() => setProfile(id)}>
              <Row style={{ justifyContent: 'space-between' }}><Txt weight="800">{c.name}</Txt><Pill label={c.tier} t={c.tier === 'VIP' ? 'gold' : 'green'} /></Row>
              <Txt size={13} color={C.sub}>Lực {c.pressure} · đã đến {c.visits} lần · gói còn {c.packageLeft} buổi</Txt>
              {c.note ? <Txt size={13} color={C.tan}>📝 {c.note}</Txt> : null}
            </Card>
          );
        }) : <Empty text="Chưa có khách hôm nay" />}
        {sheet}
      </Screen>
    );
  }

  const income = done.reduce((a, b) => a + svc(b.serviceId).tourFee, 0);
  return (
    <Screen>
      <MePanel staffId={me.id} role="ktv" extra={
        <Section title="Thu nhập tour hôm nay (tạm tính)">
          <Card style={{ gap: 6 }}>
            <Txt size={26} weight="800" color={C.green}>{vnd(income)}</Txt>
            <Txt size={13} color={C.sub}>{done.length} tour hoàn thành · tính theo bảng phí tour hiện hành. Chỉ xem, không chỉnh sửa.</Txt>
          </Card>
        </Section>
      } />
    </Screen>
  );
}
