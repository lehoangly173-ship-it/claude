import React, { useState } from 'react';
import { View } from 'react-native';
import { CEO_PRIORITIES, MONTH_BASE } from '../data';
import { CustomerSheet } from '../shared';
import { alerts, ceo, maskPhone, money, useApp, vnd } from '../store';
import { C } from '../theme';
import { AlertList, Avatar, Bar, Card, Grid, Pill, Row, Screen, Section, Stat, Title, Txt } from '../ui';
import { MePanel, Nav } from './common';

function Bars({ rows, color = C.green, fmt = (v: number) => String(v) }: { rows: { name: string; value: number; extra?: string }[]; color?: string; fmt?: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card style={{ gap: 10 }}>
      {rows.map((r) => (
        <View key={r.name} style={{ gap: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={13}>{r.name}</Txt>
            <Txt size={13} weight="700">{fmt(r.value)}{r.extra ? <Txt size={11} color={C.sub}>  {r.extra}</Txt> : null}</Txt>
          </Row>
          <Bar pct={(r.value / max) * 100} color={color} />
        </View>
      ))}
    </Card>
  );
}

export function Ceo({ nav }: { nav: Nav }) {
  const s = useApp();
  const d = ceo(s);
  const [profile, setProfile] = useState<string | null>(null);

  if (nav.tab === 0) {
    const biz = [
      ...alerts(s).filter((a) => a.level === 'red'),
      ...d.vipAtRisk.map((c) => ({ id: 'v' + c.id, level: 'amber' as const, title: `VIP ${c.name} ${c.lastVisitDaysAgo} ngày chưa quay lại`, sub: 'Nguy cơ mất khách — giao CSKH' })),
      ...(d.m.unpaid.length ? [{ id: 'up', level: 'amber' as const, title: `${d.m.unpaid.length} hóa đơn chưa thu`, sub: `${vnd(d.m.revenuePending)} đang treo` }] : []),
    ];
    return (
      <Screen>
        <Title kicker="Tổng quan HOME" title="Sức khỏe kinh doanh" sub="Hôm nay · số liệu tự gom từ lễ tân và KTV" />
        <Grid>
          <Stat label="Tiền đã thu hôm nay" value={money(d.m.revenuePaid)} sub={`Doanh thu dịch vụ ${money(d.m.serviceRevenue)} · chờ thu ${money(d.m.revenuePending)}`} t="green" />
          <Stat label="Doanh thu tháng" value={money(d.monthRevenue)} sub={`${d.targetPct}% mục tiêu ${money(MONTH_BASE.target)}`} t="gold" chips={[{ label: `${d.vsLastMonth >= 0 ? "▲" : "▼"} ${Math.abs(d.vsLastMonth)}% so tháng trước`, t: d.vsLastMonth >= 0 ? 'green' : 'red' }]} />
          <Stat label="Lợi nhuận tạm tính" value={money(d.profit)} sub={`Chi phí ${money(d.monthCost)}`} t="tan" />
          <Stat label="Khách hôm nay" value={d.custToday} sub={`${d.newToday} khách mới · ${d.vipToday} VIP`} t="blue" />
          <Stat label="VIP active" value={d.vipActive} sub={`${d.vipAtRisk.length} VIP có nguy cơ rời`} t="purple" />
          <Stat label="Công suất giường" value={`${d.utilization}%`} sub={`${d.m.bedsUsed}/${d.m.bedsTotal} giường · ${d.m.ktvBusy}/${d.m.ktvInShift} KTV bận`} t="amber" />
        </Grid>
        <Section title="Cảnh báo quan trọng"><AlertList items={biz} /></Section>
        <Section title="3 ưu tiên tuần này">
          <Card style={{ gap: 8 }}>
            {CEO_PRIORITIES.map((p, i) => (
              <Row key={p} gap={10}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}><Txt size={12} weight="800" color={C.forest}>{i + 1}</Txt></View>
                <Txt style={{ flex: 1 }}>{p}</Txt>
              </Row>
            ))}
          </Card>
        </Section>
      </Screen>
    );
  }

  if (nav.tab === 1) {
    return (
      <Screen>
        <Title kicker="Kinh doanh" title="Doanh thu & năng suất" />
        <Section title="Doanh thu đã thu hôm nay theo dịch vụ">
          <Bars rows={d.byService.map((x) => ({ name: x.name, value: x.value, extra: `${x.count} lịch` }))} fmt={money} />
        </Section>
        <Section title="Năng suất KTV hôm nay">
          <Card style={{ padding: 0 }}>
            {d.productivity.map((p, i) => (
              <Row key={p.k.id} gap={10} style={{ padding: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                <Avatar name={p.k.name} color={p.k.color} size={28} />
                <Txt weight="700" style={{ flex: 1 }}>{p.k.name}</Txt>
                <Pill label={p.status.label} t={p.status.tone} />
                <Txt size={13} style={{ width: 44, textAlign: 'right' }}>{p.tours} tour</Txt>
                <Txt size={13} weight="700" style={{ width: 56, textAlign: 'right' }}>{money(p.revenue)}</Txt>
              </Row>
            ))}
          </Card>
        </Section>
        <Section title="Tháng này">
          <Card style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}><Txt color={C.sub}>Doanh thu</Txt><Txt weight="700">{vnd(d.monthRevenue)}</Txt></Row>
            <Row style={{ justifyContent: 'space-between' }}><Txt color={C.sub}>Chi phí (gồm phí tour)</Txt><Txt weight="700">{vnd(d.monthCost)}</Txt></Row>
            <Row style={{ justifyContent: 'space-between' }}><Txt weight="800">Lợi nhuận tạm tính</Txt><Txt weight="800" color={C.green}>{vnd(d.profit)}</Txt></Row>
            <Bar pct={d.targetPct} color={C.gold} />
            <Txt size={12} color={C.sub}>{d.targetPct}% mục tiêu tháng · giá trị trung bình hóa đơn hôm nay {money(d.avgTicket)} · chi phí phí tour tính khi đã thu tiền</Txt>
          </Card>
        </Section>
      </Screen>
    );
  }

  if (nav.tab === 2) {
    return (
      <Screen>
        <Title kicker="Khách hàng" title="Tệp khách" sub={`${s.customers.length} hồ sơ · số điện thoại được ẩn`} />
        <Section title="Theo hạng khách"><Bars rows={d.tierCount} color={C.purple} /></Section>
        <Section title="Theo kênh đến (giữ kênh đầu tiên)"><Bars rows={d.bySource} color={C.blue} /></Section>
        <Section title="VIP có nguy cơ rời">
          {d.vipAtRisk.map((c) => (
            <Card key={c.id} onPress={() => setProfile(c.id)} style={{ gap: 4 }} accent={C.red}>
              <Txt weight="800">{c.name}</Txt>
              <Txt size={12} color={C.sub}>{maskPhone(c.phone)} · {c.lastVisitDaysAgo} ngày chưa quay lại · còn {c.packageLeft} buổi gói</Txt>
            </Card>
          ))}
        </Section>
        <CustomerSheet id={profile} role="ceo" onClose={() => setProfile(null)} />
      </Screen>
    );
  }

  return <Screen><MePanel staffId={nav.staffId} role="ceo" /></Screen>;
}
