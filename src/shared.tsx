import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BEDS, Booking, CLEAN_STEPS, Role, SERVICES, SHIFTS, Source } from './data';
import {
  bedStatus, canSeePhone, cust, digits, endOf, freeBeds, hhmm, ktvStatus, ktvs, maskPhone, staffById, suggestBed, suggestKtv, svc, tourCount, useApp, vnd, phoneFor, can,
} from './store';
import { C, tone } from './theme';
import { Avatar, Btn, Card, Check, Choice, Empty, Field, Pill, Row, Section, Seg, Sheet, Txt } from './ui';

const tierTone = (t: string) => (t === 'VIP' ? 'gold' : t === 'Khách mới' ? 'blue' : t === 'Khách NN' ? 'purple' : 'green') as any;
const pressureTone = (p: string) => (p === 'mạnh' ? 'red' : p === 'vừa' ? 'amber' : 'green') as any;

// ---------- Thẻ khách đang chờ ----------
export function WaitingCard({ b, onAssign, onProfile }: { b: Booking; onAssign: () => void; onProfile: () => void }) {
  const s = useApp();
  const c = cust(s, b.customerId);
  const sv = svc(b.serviceId);
  const wait = s.now - (b.arrivedAt ?? s.now);
  return (
    <Card style={{ gap: 6 }} accent={wait > 10 ? C.red : C.gold}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt size={15} weight="800">{c.name}</Txt>
        <Pill label={c.tier} t={tierTone(c.tier)} />
      </Row>
      <Txt size={12} color={C.sub}>{b.start === b.arrivedAt ? `Đến lúc ${hhmm(b.arrivedAt!)}` : `Lịch hẹn ${hhmm(b.start)} · đến ${hhmm(b.arrivedAt ?? b.start)}`} · {sv.name} · {sv.minutes}ph</Txt>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Pill label={`⏳ Chờ ${wait} phút`} t={wait > 10 ? 'red' : 'amber'} />
        <Pill label={`Lực: ${c.pressure}`} t={pressureTone(c.pressure)} />
        {b.requestedKtvId ? <Pill label={`Y/C: ${staffById(b.requestedKtvId)?.name}`} t="purple" /> : null}
      </Row>
      {c.note || b.note ? <Txt size={12} color={C.tan}>📝 {b.note || c.note}</Txt> : null}
      <Row>
        <Btn small kind="ghost" label="Xem hồ sơ" onPress={onProfile} style={{ flex: 1 }} />
        <Btn small label="⚡ Chia tour" onPress={onAssign} style={{ flex: 1.3 }} />
      </Row>
    </Card>
  );
}

// ---------- Bảng KTV theo ca ----------
export function KtvBoard() {
  const s = useApp();
  return (
    <>
      {(['ca1', 'ca2'] as const).map((sh) => (
        <Section key={sh} title={`${SHIFTS[sh].name} · ${hhmm(SHIFTS[sh].start)} – ${hhmm(SHIFTS[sh].end)}`}>
          <Card style={{ padding: 0 }}>
            {ktvs().filter((k) => k.shift === sh).sort((a, b) => a.order - b.order).map((k, i) => {
              const st = ktvStatus(s, k.id);
              return (
                <Row key={k.id} gap={10} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                  <Txt size={12} weight="800" color={C.sub} style={{ width: 16 }}>{k.order}</Txt>
                  <Avatar name={k.name} color={k.color} size={32} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt weight="700">{k.name}</Txt>
                    <Row gap={6}><Pill label={st.label} t={st.tone} />{st.until ? <Txt size={11} color={C.sub}>→ {hhmm(st.until)}</Txt> : null}</Row>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Txt size={18} weight="800">{tourCount(s, k.id)}</Txt>
                    <Txt size={10} color={C.sub}>tour</Txt>
                  </View>
                </Row>
              );
            })}
          </Card>
        </Section>
      ))}
    </>
  );
}

// ---------- Chia tour ----------
export function AssignSheet({ bookingId, onClose }: { bookingId: string | null; onClose: () => void }) {
  const s = useApp();
  const b = s.bookings.find((x) => x.id === bookingId);
  const [ktv, setKtv] = useState<string | undefined>();
  const [bed, setBed] = useState<string | undefined>();
  const [err, setErr] = useState<string | null>(null);
  const sk = b ? suggestKtv(s, b) : undefined;
  const sb = b ? suggestBed(s, b) : undefined;
  const pickK = ktv ?? sk;
  const pickB = bed ?? sb;
  const close = () => { setKtv(undefined); setBed(undefined); setErr(null); onClose(); };
  if (!b) return null;
  const c = cust(s, b.customerId);
  const beds = freeBeds(s, svc(b.serviceId).kind, b);
  return (
    <Sheet visible={!!b} onClose={close} title={`Chia tour · ${c.name}`}>
      <Txt color={C.sub}>{svc(b.serviceId).name} · {svc(b.serviceId).minutes} phút{b.requestedKtvId ? ` · Khách yêu cầu ${staffById(b.requestedKtvId)?.name}` : ''}</Txt>
      <Choice label="Kỹ thuật viên (gợi ý theo lượt tour ít nhất)" value={pickK} onChange={setKtv}
        options={ktvs().map((k) => { const st = ktvStatus(s, k.id); return { v: k.id, label: `${k.name}${k.id === sk ? ' ★' : ''}`, sub: `${st.label} · ${tourCount(s, k.id)} tour`, disabled: st.key !== 'free' }; })} />
      <Choice label={`Giường trống (${beds.length})`} value={pickB} onChange={setBed}
        options={beds.map((x) => ({ v: x.id, label: x.id, sub: `${x.floor} · ${x.room}` }))} />
      {err ? <Pill label={err} t="red" big /> : null}
      <Btn label="Xác nhận chia tour" disabled={!pickK || !pickB}
        onPress={() => { const e = s.assign(b.id, pickK!, pickB!); e ? setErr(e) : close(); }} />
    </Sheet>
  );
}

// ---------- Tạo lịch nhanh ----------
export function NewBookingSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const s = useApp();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string | undefined>();
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<Source>('Vãng lai');
  const [service, setService] = useState<string>('s1');
  const [time, setTime] = useState<string>('now');
  const [ktv, setKtv] = useState<string>('none');
  const [err, setErr] = useState<string | null>(null);
  const [forceNew, setForceNew] = useState(false);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const d = digits(t);
    return s.customers.filter((c) => (c.name + c.id).toLowerCase().includes(t) || (canSeePhone(s) && d.length >= 3 && digits(c.phone).includes(d))).slice(0, 5);
  }, [q, s.customers, s.session]);
  const isNew = !!q.trim() && (!matches.length || forceNew);
  const slots = useMemo(() => {
    const first = Math.ceil((s.now + 1) / 15) * 15;
    const out: { v: string; label: string }[] = [{ v: 'now', label: 'Khách đến ngay' }];
    for (let t = first; t <= 19 * 60 && out.length < 17; t += 15) out.push({ v: String(t), label: hhmm(t) });
    return out;
  }, [s.now]);
  const reset = () => { setQ(''); setPicked(undefined); setPhone(''); setSource('Vãng lai'); setService('s1'); setTime('now'); setKtv('none'); setErr(null); setForceNew(false); };
  const close = () => { reset(); onClose(); };
  const submit = () => {
    const e = s.createBooking({
      customerId: picked,
      newCustomer: picked ? undefined : { name: q, phone, source },
      serviceId: service,
      start: time === 'now' ? s.now : Number(time),
      requestedKtvId: ktv === 'none' ? undefined : ktv,
    });
    e ? setErr(e) : close();
  };
  const pc = picked ? cust(s, picked) : null;
  return (
    <Sheet visible={visible} onClose={close} title="Tạo lịch nhanh">
      {pc ? (
        <Card style={{ gap: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}><Txt weight="800">{pc.name}</Txt><Pill label={pc.tier} t={tierTone(pc.tier)} /></Row>
          <Txt size={12} color={C.sub}>{phoneFor(s, pc.phone)} · {pc.visits} lần · còn {pc.packageLeft} buổi gói</Txt>
          <Btn small kind="ghost" label="Đổi khách" onPress={() => setPicked(undefined)} />
        </Card>
      ) : (
        <>
          <Field label="Tên khách hoặc số điện thoại" value={q} onChangeText={(t) => { setQ(t); setForceNew(false); }} placeholder="VD: Nguyễn Thị Mai" />
          {!forceNew && matches.map((c) => (
            <Pressable key={c.id} onPress={() => setPicked(c.id)}>
              <Card style={{ paddingVertical: 10 }}><Txt weight="700">{c.name} <Txt size={12} color={C.sub}>· {phoneFor(s, c.phone)} · {c.tier}</Txt></Txt></Card>
            </Pressable>
          ))}
          {matches.length && !forceNew ? <Btn small kind="ghost" label={`Không phải — tạo khách mới “${q.trim()}”`} onPress={() => setForceNew(true)} /> : null}
          {isNew ? <Txt size={12} color={C.green} weight="700">+ Khách mới: {q}</Txt> : null}
          {isNew ? <Field label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="0901 234 567" keyboardType="phone-pad" /> : null}
          {isNew ? <Choice label="Khách biết Home qua đâu (giữ kênh đầu tiên)" value={source} onChange={setSource}
            options={(['Facebook', 'TikTok', 'Google Maps', 'Giới thiệu', 'Vãng lai', 'Tour'] as Source[]).map((x) => ({ v: x, label: x }))} /> : null}
        </>
      )}
      <Choice label="Dịch vụ" value={service} onChange={setService} options={SERVICES.map((x) => ({ v: x.id, label: x.name, sub: `${x.minutes}ph · ${vnd(x.price)}` }))} />
      <Choice label="Giờ" value={time} onChange={setTime} options={slots} />
      <Choice label="KTV khách yêu cầu (không bắt buộc)" value={ktv} onChange={setKtv} options={[{ v: 'none', label: 'Không' }, ...ktvs().map((k) => ({ v: k.id, label: k.name }))]} />
      {err ? <Pill label={err} t="red" big /> : null}
      <Btn label="Xác nhận tạo lịch" onPress={submit} disabled={!picked && !isNew} />
      {!picked && !isNew && q.trim() ? <Txt size={12} color={C.sub}>Chọn khách trong danh sách, hoặc bấm “tạo khách mới”.</Txt> : null}
    </Sheet>
  );
}

// ---------- Hồ sơ khách ----------
export function CustomerSheet({ id, role, onClose }: { id: string | null; role: Role; onClose: () => void }) {
  const s = useApp();
  if (!id) return null;
  const c = cust(s, id);
  const hist = s.bookings.filter((b) => b.customerId === id && b.status !== 'cancelled');
  const logs = s.careLogs.filter((l) => l.customerId === id);
  const F = ({ k, v }: { k: string; v: string }) => (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.line }}>
      <Txt size={13} color={C.sub}>{k}</Txt><Txt size={13} weight="600" style={{ flex: 1, textAlign: 'right' }}>{v}</Txt>
    </Row>
  );
  return (
    <Sheet visible onClose={onClose} title={c.name}>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Pill label={c.tier} t={tierTone(c.tier)} big />
        <Pill label={c.id} big />
        <Pill label={`Nguồn: ${c.source}`} t="blue" big />
      </Row>
      <Card style={{ gap: 0 }}>
        <F k="Số điện thoại" v={canSeePhone(s) ? c.phone : `${maskPhone(c.phone)} (cần quyền xem số điện thoại)`} />
        <F k="Sinh nhật" v={c.birthday.split('-').reverse().join('/')} />
        <F k="Số lần đến" v={`${c.visits} lần · lần cuối ${c.lastVisitDaysAgo === 0 ? 'hôm nay' : c.lastVisitDaysAgo + ' ngày trước'}`} />
        <F k="Gói còn lại" v={`${c.packageLeft} buổi`} />
        <F k="Ngân sách" v={c.budget} />
        <F k="Lực ưa thích" v={c.pressure} />
        <F k="Ghi chú / bệnh lý" v={c.note || '—'} />
      </Card>
      <Section title="Hôm nay">
        {hist.length ? hist.map((b) => (
          <Card key={b.id} style={{ paddingVertical: 10 }}>
            <Txt weight="700">{hhmm(b.start)} · {svc(b.serviceId).name}</Txt>
            <Txt size={12} color={C.sub}>{b.ktvId ? `KTV ${staffById(b.ktvId)?.name} · ${b.bedId}` : 'Chưa chia tour'} · {statusLabel(b)}</Txt>
          </Card>
        )) : <Empty text="Không có lịch hôm nay" />}
      </Section>
      {logs.length ? <Section title="Lịch sử CSKH">{logs.map((l, i) => <Txt key={i} size={13}>• {hhmm(l.at)} — {staffById(l.byId)?.name} ({l.kind})</Txt>)}</Section> : null}
    </Sheet>
  );
}

export const statusLabel = (b: Booking) => ({
  booked: 'Đã hẹn', waiting: 'Đang chờ', assigned: 'Đã chia tour', inService: 'Đang làm',
  done: b.paid ? 'Đã thanh toán' : 'Chờ thanh toán', cancelled: 'Đã hủy',
}[b.status]);
export const statusTone = (b: Booking) => ({
  booked: 'purple', waiting: 'amber', assigned: 'purple', inService: 'green', done: b.paid ? 'gray' : 'tan', cancelled: 'red',
}[b.status]) as any;

// ---------- Sơ đồ giường ----------
export function BedMap({ role }: { role: Role }) {
  const s = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const floors = [...new Set(BEDS.map((b) => b.floor))];
  const counts = BEDS.map((b) => bedStatus(s, b.id).key);
  const legend = [
    { k: 'busy', l: 'Đang làm', t: 'green' }, { k: 'soon', l: 'Sắp xong', t: 'amber' }, { k: 'prep', l: 'Chuẩn bị', t: 'blue' },
    { k: 'free', l: 'Trống', t: 'gray' }, { k: 'cleaning', l: 'Đang dọn', t: 'tan' }, { k: 'reserved', l: 'Lịch hẹn', t: 'purple' },
  ] as const;
  const ob = open ? bedStatus(s, open) : null;
  return (
    <>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {legend.map((x) => <Pill key={x.k} big t={x.t} label={`${counts.filter((c) => c === x.k).length} ${x.l}`} />)}
      </Row>
      {floors.map((f) => (
        <Section key={f} title={f}>
          {[...new Set(BEDS.filter((b) => b.floor === f).map((b) => b.room))].map((room) => (
            <Card key={room} style={{ gap: 8 }}>
              <Txt size={11} weight="700" color={C.sub}>{room.toUpperCase()}</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {BEDS.filter((b) => b.floor === f && b.room === room).map((bed) => {
                  const st = bedStatus(s, bed.id);
                  const t = tone(st.tone);
                  return (
                    <Pressable key={bed.id} onPress={() => setOpen(bed.id)} style={{ width: 98, minHeight: 84, borderRadius: 12, padding: 8, backgroundColor: st.key === 'free' ? '#FAF8F4' : t.bg, borderWidth: 1.5, borderColor: st.key === 'free' ? C.line : t.fg }}>
                      <Txt size={13} weight="800" color={st.key === 'free' ? C.sub : t.fg}>{bed.id}</Txt>
                      <Txt size={10} weight="700" color={t.fg}>{st.label}</Txt>
                      {st.booking ? <Txt size={10} color={C.ink} lines={1}>{cust(s, st.booking.customerId).name}</Txt> : null}
                      {st.booking ? <Txt size={10} color={C.sub} lines={1}>KTV: {staffById(st.booking.ktvId ?? st.booking.requestedKtvId)?.name ?? '—'}</Txt> : null}
                      {st.booking ? <Txt size={10} color={C.sub}>{hhmm(st.booking.startedAt ?? st.booking.start)}–{hhmm(endOf(st.booking))}</Txt> : null}
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ))}
        </Section>
      ))}
      {open && ob ? (
        <Sheet visible onClose={() => setOpen(null)} title={`Giường ${open}`}>
          <Pill label={ob.label} t={ob.tone} big />
          {ob.booking ? (
            <Card style={{ gap: 4 }}>
              <Txt weight="800">{cust(s, ob.booking.customerId).name}</Txt>
              <Txt size={13} color={C.sub}>{svc(ob.booking.serviceId).name} · {hhmm(ob.booking.startedAt ?? ob.booking.start)}–{hhmm(endOf(ob.booking))}</Txt>
              <Txt size={13} color={C.sub}>KTV: {staffById(ob.booking.ktvId ?? ob.booking.requestedKtvId)?.name ?? '—'}</Txt>
              {role === 'reception' && ob.booking.status === 'assigned' ? <Btn small label="▶ Bắt đầu (thay KTV)" onPress={() => s.startService(ob.booking!.id)} /> : null}
              {role === 'reception' && ob.booking.status === 'inService' ? <Btn small label="✓ Hoàn thành (thay KTV)" onPress={() => { s.complete(ob.booking!.id); }} /> : null}
            </Card>
          ) : null}
          {s.cleaning[open] ? (
            <Card>
              <Txt size={11} weight="700" color={C.sub}>CHECKLIST DỌN GIƯỜNG</Txt>
              {CLEAN_STEPS.map((step, i) => <Check key={step} label={step} on={!!s.cleaning[open]?.[i]} onPress={() => s.toggleClean(open, i)} />)}
              {role === 'reception' ? <Btn kind="soft" small label="Xác nhận giường sẵn sàng" onPress={() => { s.bedReady(open); setOpen(null); }} /> : null}
            </Card>
          ) : null}
          {ob.key === 'free' ? <Txt color={C.sub}>Giường trống, có thể chia tour.</Txt> : null}
        </Sheet>
      ) : null}
    </>
  );
}

// ---------- Lịch điều phối ----------
export function Schedule({ onOpenBooking }: { onOpenBooking: (id: string) => void }) {
  const s = useApp();
  const [mode, setMode] = useState<'ktv' | 'time'>('ktv');
  const active = s.bookings.filter((b) => b.status !== 'cancelled').sort((a, b) => (a.startedAt ?? a.start) - (b.startedAt ?? b.start));
  const chip = (b: Booking, showKtv?: boolean) => {
    const t = tone(statusTone(b));
    return (
      <Pressable key={b.id} onPress={() => onOpenBooking(b.id)} style={{ backgroundColor: t.bg, borderLeftWidth: 3, borderLeftColor: t.fg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, minWidth: 120 }}>
        <Txt size={12} weight="800" lines={1}>{cust(s, b.customerId).name}</Txt>
        <Txt size={11} color={C.sub}>{hhmm(b.startedAt ?? b.start)}–{hhmm(endOf(b))}{b.bedId ? ` · ${b.bedId}` : ''}</Txt>
        <Txt size={10} weight="700" color={t.fg}>{showKtv ? `${staffById(b.ktvId ?? b.requestedKtvId)?.name ?? 'Chưa có KTV'} · ` : ''}{statusLabel(b)}</Txt>
      </Pressable>
    );
  };
  return (
    <>
      <Seg value={mode} onChange={setMode} options={[{ v: 'ktv', label: 'Theo KTV' }, { v: 'time', label: 'Theo giờ' }]} />
      {mode === 'ktv' ? (
        <>
          {ktvs().map((k) => {
            const list = active.filter((b) => (b.ktvId ?? b.requestedKtvId) === k.id);
            const st = ktvStatus(s, k.id);
            return (
              <Card key={k.id} style={{ gap: 8 }}>
                <Row gap={8}>
                  <Avatar name={k.name} color={k.color} size={28} />
                  <Txt weight="800" style={{ flex: 1 }}>{k.name} <Txt size={11} color={C.sub}>· {SHIFTS[k.shift].name}</Txt></Txt>
                  <Pill label={st.label} t={st.tone} />
                </Row>
                {list.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{list.map((b) => chip(b))}</View> : <Txt size={12} color={C.faint}>Chưa có lịch</Txt>}
              </Card>
            );
          })}
          {active.some((b) => !b.ktvId && !b.requestedKtvId) ? (
            <Card style={{ gap: 8 }}>
              <Txt weight="800">Chưa phân KTV</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{active.filter((b) => !b.ktvId && !b.requestedKtvId).map((b) => chip(b))}</View>
            </Card>
          ) : null}
        </>
      ) : (
        <Card style={{ padding: 0 }}>
          {active.map((b, i) => (
            <Row key={b.id} gap={10} style={{ padding: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line, opacity: b.status === 'done' ? 0.55 : 1 }}>
              <Txt size={13} weight="800" style={{ width: 44 }}>{hhmm(b.startedAt ?? b.start)}</Txt>
              <View style={{ flex: 1 }}>{chip(b, true)}</View>
            </Row>
          ))}
        </Card>
      )}
    </>
  );
}

export function BookingSheet({ id, onClose, onAssign }: { id: string | null; onClose: () => void; onAssign: (id: string) => void }) {
  const s = useApp();
  const b = s.bookings.find((x) => x.id === id);
  if (!b) return null;
  const c = cust(s, b.customerId);
  return (
    <Sheet visible onClose={onClose} title={c.name}>
      <Row gap={6}><Pill big label={statusLabel(b)} t={statusTone(b)} /><Pill big label={c.tier} t={tierTone(c.tier)} /></Row>
      <Card style={{ gap: 4 }}>
        <Txt weight="700">{svc(b.serviceId).name} · {svc(b.serviceId).minutes} phút · {vnd(svc(b.serviceId).price)}</Txt>
        <Txt size={13} color={C.sub}>Giờ: {hhmm(b.startedAt ?? b.start)} – {hhmm(endOf(b))}</Txt>
        <Txt size={13} color={C.sub}>KTV: {staffById(b.ktvId)?.name ?? (b.requestedKtvId ? `${staffById(b.requestedKtvId)?.name} (khách yêu cầu)` : '—')} · Giường: {b.bedId ?? '—'}</Txt>
      </Card>
      {b.status === 'booked' ? <Btn label="Khách đã đến → vào hàng chờ" onPress={() => { s.checkInCustomer(b.id); onClose(); }} /> : null}
      {b.status === 'waiting' ? <Btn label="⚡ Chia tour" onPress={() => { onClose(); onAssign(b.id); }} /> : null}
      {b.status === 'assigned' ? <Btn label="▶ Bắt đầu (thay KTV)" onPress={() => s.startService(b.id)} /> : null}
      {b.status === 'inService' ? <Btn label="✓ Hoàn thành (thay KTV)" onPress={() => { s.complete(b.id); onClose(); }} /> : null}
      {b.status === 'booked' || b.status === 'waiting' ? <Btn kind="danger" label="Hủy lịch" onPress={() => { s.cancel(b.id); onClose(); }} /> : null}
    </Sheet>
  );
}

// ---------- Thu ngân ----------
export function Cashier() {
  const s = useApp();
  const unpaid = s.bookings.filter((b) => b.status === 'done' && !b.paid);
  const paid = s.bookings.filter((b) => b.status === 'done' && b.paid);
  const [method, setMethod] = useState<Record<string, Booking['payMethod']>>({});
  const methods: NonNullable<Booking['payMethod']>[] = ['Tiền mặt', 'Chuyển khoản', 'Thẻ', 'Trừ gói'];
  const byMethod = methods.map((m) => ({ m, v: paid.filter((b) => b.payMethod === m).reduce((a, b) => a + svc(b.serviceId).price, 0) }));
  return (
    <>
      <Section title={`Chờ thanh toán (${unpaid.length})`}>
        {unpaid.length ? unpaid.map((b) => {
          const c = cust(s, b.customerId);
          const pick = method[b.id] ?? (c.packageLeft > 0 ? 'Trừ gói' : 'Tiền mặt');
          return (
            <Card key={b.id} style={{ gap: 8 }} accent={C.tan}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt weight="800">{c.name}</Txt><Txt size={16} weight="800">{vnd(svc(b.serviceId).price)}</Txt>
              </Row>
              <Txt size={12} color={C.sub}>{svc(b.serviceId).name} · KTV {staffById(b.ktvId)?.name} · {b.bedId} · xong {hhmm(b.endedAt ?? endOf(b))}</Txt>
              <Choice label={`Hình thức${c.packageLeft ? ` (còn ${c.packageLeft} buổi gói)` : ''}`} value={pick} onChange={(v) => setMethod({ ...method, [b.id]: v })}
                options={methods.map((m) => ({ v: m, label: m, disabled: m === 'Trừ gói' && c.packageLeft < 1 }))} />
              <Btn label={`Thu ${vnd(svc(b.serviceId).price)}`} onPress={() => s.pay(b.id, pick)} />
            </Card>
          );
        }) : <Empty text="Không còn khách chờ thanh toán" />}
      </Section>
      <Section title="Đã thu hôm nay">
        <Card style={{ gap: 6 }}>
          {byMethod.filter((x) => x.m !== 'Trừ gói').map((x) => <Row key={x.m} style={{ justifyContent: 'space-between' }}><Txt color={C.sub}>{x.m}</Txt><Txt weight="700">{vnd(x.v)}</Txt></Row>)}
          <View style={{ height: 1, backgroundColor: C.line }} />
          <Row style={{ justifyContent: 'space-between' }}><Txt weight="800">Tiền thực thu</Txt><Txt weight="800" color={C.green}>{vnd(byMethod.filter((x) => x.m !== 'Trừ gói').reduce((a, x) => a + x.v, 0))}</Txt></Row>
          <Row style={{ justifyContent: 'space-between' }}><Txt size={13} color={C.sub}>Trừ gói (tiền đã thu lúc bán gói)</Txt><Txt size={13} color={C.sub}>{vnd(byMethod.find((x) => x.m === 'Trừ gói')!.v)}</Txt></Row>
        </Card>
        {paid.map((b) => (
          <Card key={b.id} style={{ paddingVertical: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt weight="700">{cust(s, b.customerId).name}</Txt><Txt size={13}>{vnd(svc(b.serviceId).price)}</Txt>
            </Row>
            <Txt size={12} color={C.sub}>{svc(b.serviceId).name} · {b.payMethod}</Txt>
          </Card>
        ))}
      </Section>
    </>
  );
}
