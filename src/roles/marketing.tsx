import React, { useState } from 'react';
import { View } from 'react-native';
import { CAMPAIGNS, LEADS, Source } from '../data';
import { CustomerSheet } from '../shared';
import { careList, maskPhone, staffById, useApp } from '../store';
import { C } from '../theme';
import { Bar, Btn, Card, Check, Empty, Grid, Pill, Row, Screen, Section, Stat, Title, Txt } from '../ui';
import { MePanel, Nav } from './common';

export function Marketing({ nav }: { nav: Nav }) {
  const s = useApp();
  const [profile, setProfile] = useState<string | null>(null);
  const care = careList(s);
  const photos = s.contentTasks.filter((c) => c.kind === 'Ảnh');
  const videos = s.contentTasks.filter((c) => c.kind === 'Video');
  const contentDone = s.contentTasks.filter((c) => c.done).length;
  const sheet = <CustomerSheet id={profile} role="marketing" onClose={() => setProfile(null)} />;

  const CareCards = ({ limit }: { limit?: number }) => (
    <>
      {(limit ? care.slice(0, limit) : care).map((x) => (
        <Card key={x.customer.id + x.kind} style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}><Txt weight="800">{x.customer.name}</Txt><Pill label={x.reason} t={x.tone} /></Row>
          <Txt size={12} color={C.sub}>{maskPhone(x.customer.phone)} · {x.customer.tier} · {x.customer.source}</Txt>
          <Row><Btn small kind="ghost" label="Hồ sơ" onPress={() => setProfile(x.customer.id)} style={{ flex: 1 }} /><Btn small label="✓ Đã nhắn" onPress={() => s.logCare(x.customer.id, x.kind)} style={{ flex: 1 }} /></Row>
        </Card>
      ))}
      {!care.length ? <Empty text="Đã chăm sóc hết danh sách hôm nay" /> : null}
    </>
  );

  if (nav.tab === 0) {
    return (
      <Screen>
        <Title kicker="Hôm nay" title="Marketing · CSKH" sub="Mục tiêu: 2 ảnh + 2 video mỗi ngày (chung với lễ tân)" />
        <Grid>
          <Stat label="Nội dung hôm nay" value={`${contentDone}/4`} sub={`${photos.filter((p) => p.done).length}/2 ảnh · ${videos.filter((v) => v.done).length}/2 video`} t="purple" />
          <Stat label="Cần CSKH" value={care.length} sub="Sinh nhật · hỏi thăm · lâu chưa quay lại" t="amber" />
        </Grid>
        <Section title="Nội dung cần làm">
          <Card>
            <Bar pct={(contentDone / 4) * 100} color={C.purple} />
            {s.contentTasks.map((c) => <Check key={c.id} on={c.done} label={`${c.kind}: ${c.title}`} sub={`${c.channel} · ${staffById(c.ownerId)?.name}`} onPress={() => s.toggleContent(c.id)} />)}
          </Card>
        </Section>
        <Section title="CSKH ưu tiên"><CareCards limit={3} /></Section>
        {sheet}
      </Screen>
    );
  }

  if (nav.tab === 1) {
    return (
      <Screen>
        <Title kicker="Nội dung" title="Lịch chiến dịch" />
        {CAMPAIGNS.map((c) => (
          <Card key={c.name} style={{ gap: 4 }} accent={c.status === 'Đang chạy' ? C.green : C.amber}>
            <Row style={{ justifyContent: 'space-between' }}><Txt weight="800" style={{ flex: 1 }}>{c.name}</Txt><Pill label={c.status} t={c.status === 'Đang chạy' ? 'green' : 'amber'} /></Row>
            <Txt size={12} color={C.sub}>{c.when} · {c.channel}</Txt>
          </Card>
        ))}
        <Section title="Kho nội dung hôm nay">
          {s.contentTasks.map((c) => (
            <Card key={c.id} style={{ gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}><Txt weight="700" style={{ flex: 1 }}>{c.title}</Txt><Pill label={c.done ? 'Chờ duyệt' : 'Chưa làm'} t={c.done ? 'blue' : 'gray'} /></Row>
              <Txt size={12} color={C.sub}>{c.kind} · {c.channel} · {staffById(c.ownerId)?.name}</Txt>
            </Card>
          ))}
          <Txt size={12} color={C.sub}>Nội dung làm xong chuyển “Chờ duyệt” — Marketing không tự đăng một mình.</Txt>
        </Section>
      </Screen>
    );
  }

  if (nav.tab === 2) {
    const sources = Object.keys(LEADS) as Source[];
    const rows = sources.map((src) => {
      const custs = s.customers.filter((c) => c.source === src);
      const visited = custs.filter((c) => c.visits > 0 || s.bookings.some((b) => b.customerId === c.id && b.status !== 'booked' && b.status !== 'cancelled'));
      const pkg = custs.filter((c) => c.packageLeft > 0);
      return { src, leads: LEADS[src], custs: custs.length, visited: visited.length, pkg: pkg.length };
    });
    const max = Math.max(...rows.map((r) => r.leads));
    return (
      <Screen>
        <Title kicker="Khách hàng" title="Phễu theo kênh" sub="Hỏi → Thành khách → Đã đến → Mua gói" />
        {rows.map((r) => (
          <Card key={r.src} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}><Txt weight="800">{r.src}</Txt><Txt size={12} color={C.sub}>{r.leads} lượt hỏi</Txt></Row>
            <Bar pct={(r.leads / max) * 100} color={C.blue} />
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              <Pill label={`${r.custs} khách`} t="blue" />
              <Pill label={`${r.visited} đã đến`} t="green" />
              <Pill label={`${r.pkg} có gói`} t="gold" />
              <Pill label={`Chuyển đổi ${r.leads ? Math.round((r.custs / r.leads) * 100) : 0}%`} t="purple" />
            </Row>
          </Card>
        ))}
        <Section title={`Danh sách CSKH (${care.length})`}><CareCards /></Section>
        {sheet}
      </Screen>
    );
  }

  return <Screen><MePanel staffId={nav.staffId} role="marketing" /></Screen>;
}
