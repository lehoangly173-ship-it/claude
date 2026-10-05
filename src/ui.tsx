import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { C, R, Tone, tone } from './theme';
import type { Alert } from './store';

export function Txt({ size = 14, color = C.ink, weight = '400', style, lines, children }: {
  size?: number; color?: string; weight?: '400' | '500' | '600' | '700' | '800'; style?: any; lines?: number; children: React.ReactNode;
}) {
  return <Text numberOfLines={lines} style={[{ fontSize: size, color, fontWeight: weight, lineHeight: Math.round(size * 1.35) }, style]}>{children}</Text>;
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
      {children}
    </ScrollView>
  );
}

export function Title({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
      <View style={{ flex: 1 }}>
        {kicker ? <Txt size={11} color={C.sub} weight="700" style={{ letterSpacing: 1 }}>{kicker.toUpperCase()}</Txt> : null}
        <Txt size={24} weight="800" style={{ lineHeight: 30 }}>{title}</Txt>
        {sub ? <Txt size={13} color={C.sub}>{sub}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt size={11} color={C.sub} weight="700" style={{ letterSpacing: 1 }}>{title.toUpperCase()}</Txt>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style, onPress, accent }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; accent?: string }) {
  const body = (
    <View style={[st.card, accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null, style]}>{children}</View>
  );
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>{body}</Pressable> : body;
}

export function Pill({ label, t = 'gray', big }: { label: string; t?: Tone; big?: boolean }) {
  const c = tone(t);
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: big ? 10 : 8, paddingVertical: big ? 4 : 2, borderRadius: 999, alignSelf: 'flex-start' }}>
      <Txt size={big ? 12 : 11} color={c.fg} weight="700">{label}</Txt>
    </View>
  );
}

export function Stat({ label, value, sub, t = 'green', chips, onPress }: {
  label: string; value: string | number; sub?: string; t?: Tone; chips?: { label: string; t: Tone }[]; onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} accent={tone(t).fg} style={{ flex: 1, minWidth: 150, gap: 2 }}>
      <Txt size={10} color={C.sub} weight="700" style={{ letterSpacing: 0.8 }}>{label.toUpperCase()}</Txt>
      <Txt size={28} weight="800" style={{ lineHeight: 34 }}>{value}</Txt>
      {sub ? <Txt size={12} color={C.sub}>{sub}</Txt> : null}
      {chips ? <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>{chips.map((c) => <Pill key={c.label} label={c.label} t={c.t} />)}</View> : null}
    </Card>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}

export function Btn({ label, onPress, kind = 'primary', small, disabled, icon, style }: {
  label: string; onPress?: () => void; kind?: 'primary' | 'gold' | 'ghost' | 'danger' | 'soft'; small?: boolean; disabled?: boolean; icon?: string; style?: ViewStyle;
}) {
  const bg = { primary: C.forest, gold: C.gold, ghost: 'transparent', danger: C.redSoft, soft: '#EFEAE0' }[kind];
  const fg = { primary: '#fff', gold: C.forest, ghost: C.forest, danger: C.red, soft: C.ink }[kind];
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{
        backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1, borderRadius: R.md,
        paddingVertical: small ? 7 : 12, paddingHorizontal: small ? 12 : 16, alignItems: 'center', justifyContent: 'center',
        borderWidth: kind === 'ghost' ? 1 : 0, borderColor: C.line, flexDirection: 'row', gap: 6,
      }, style]}
    >
      {icon ? <Txt size={small ? 12 : 14} color={fg} weight="700">{icon}</Txt> : null}
      <Txt size={small ? 12 : 14} color={fg} weight="700">{label}</Txt>
    </Pressable>
  );
}

export function Seg<V extends string>({ options, value, onChange }: { options: { v: V; label: string; badge?: number }[]; value: V; onChange: (v: V) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {options.map((o) => {
        const on = o.v === value;
        return (
          <Pressable key={o.v} onPress={() => onChange(o.v)} style={{ backgroundColor: on ? C.forest : '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderColor: on ? C.forest : C.line }}>
            <Txt size={13} weight="700" color={on ? '#fff' : C.ink}>{o.label}</Txt>
            {o.badge ? <View style={{ backgroundColor: C.gold, borderRadius: 999, minWidth: 18, paddingHorizontal: 5 }}><Txt size={11} weight="800" color={C.forest} style={{ textAlign: 'center' }}>{o.badge}</Txt></View> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Avatar({ name, color = C.forest2, size = 34 }: { name: string; color?: string; size?: number }) {
  const ini = name.replace(/^(Chị|Anh|Dr|KH)\s+/i, '').trim().charAt(0).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Txt size={size * 0.42} color="#fff" weight="800">{ini}</Txt>
    </View>
  );
}

export const Row = ({ children, gap = 8, style }: { children: React.ReactNode; gap?: number; style?: ViewStyle }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
);

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(20,30,24,0.45)' }} onPress={onClose} />
      <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '88%' }}>
        <Row style={{ padding: 16, paddingBottom: 8, justifyContent: 'space-between' }}>
          <Txt size={18} weight="800">{title}</Txt>
          <Pressable onPress={onClose} hitSlop={12}><Txt size={22} color={C.sub}>×</Txt></Pressable>
        </Row>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: 34 }}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

export function Field({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: any }) {
  return (
    <View style={{ gap: 4 }}>
      <Txt size={12} color={C.sub} weight="600">{label}</Txt>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.faint} keyboardType={keyboardType}
        style={{ backgroundColor: '#fff', borderRadius: R.md, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: C.ink }} />
    </View>
  );
}

export function Choice<V extends string>({ label, options, value, onChange }: { label: string; options: { v: V; label: string; sub?: string; disabled?: boolean }[]; value?: V; onChange: (v: V) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt size={12} color={C.sub} weight="600">{label}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map((o) => {
          const on = o.v === value;
          return (
            <Pressable key={o.v} disabled={o.disabled} onPress={() => onChange(o.v)} style={{
              borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5,
              borderColor: on ? C.forest : C.line, backgroundColor: on ? C.greenSoft : '#fff', opacity: o.disabled ? 0.35 : 1,
            }}>
              <Txt size={13} weight="700" color={on ? C.forest : C.ink}>{o.label}</Txt>
              {o.sub ? <Txt size={11} color={C.sub}>{o.sub}</Txt> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AlertList({ items, onGo }: { items: Alert[]; onGo?: (go?: string) => void }) {
  if (!items.length) return <Card><Txt color={C.green} weight="700">✓ Không có việc gấp</Txt></Card>;
  const col = { red: C.red, amber: C.amber, green: C.green };
  return (
    <Card style={{ padding: 0 }}>
      {items.map((a, i) => (
        <Pressable key={a.id} disabled={!onGo || !a.go} onPress={() => onGo?.(a.go)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col[a.level] }} />
          <View style={{ flex: 1 }}>
            <Txt size={14} weight="700">{a.title}</Txt>
            <Txt size={12} color={C.sub}>{a.sub}</Txt>
          </View>
          {onGo && a.go ? <Txt size={12} color={C.green} weight="700">Xử lý →</Txt> : null}
        </Pressable>
      ))}
    </Card>
  );
}

export function Bar({ pct, color = C.green }: { pct: number; color?: string }) {
  return (
    <View style={{ height: 8, backgroundColor: '#EFEAE0', borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

export function Check({ on, label, onPress, sub }: { on: boolean; label: string; onPress: () => void; sub?: string }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: on ? C.green : C.faint, backgroundColor: on ? C.green : '#fff', alignItems: 'center', justifyContent: 'center' }}>
        {on ? <Txt size={13} color="#fff" weight="800">✓</Txt> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Txt size={14} color={on ? C.sub : C.ink} style={on ? { textDecorationLine: 'line-through' } : undefined}>{label}</Txt>
        {sub ? <Txt size={12} color={C.sub}>{sub}</Txt> : null}
      </View>
    </Pressable>
  );
}

export const Empty = ({ text }: { text: string }) => <Card><Txt color={C.sub}>{text}</Txt></Card>;

const st = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.line },
});
