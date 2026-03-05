import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  StatusBar,
  Platform,
  useWindowDimensions,
  Share,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BG = require('../assets/loader_bg.png');
const AVATAR = require('../assets/angler.png');

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type Mode = 'week' | 'month';

type CatchItem = {
  id: string;
  fish: string;
  water: string;
  timeLabel: string;
  dateLabel: string;
  ts: number;
};

const STORAGE_KEY = 'catches_v1';
const DAY = 24 * 60 * 60 * 1000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeekMonday(ts: number) {
  const d = new Date(ts);
  const day = d.getDay(); 
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addDays(ts: number, days: number) {
  return ts + days * DAY;
}

function formatShortDay(ts: number) {
  return new Date(ts).toLocaleDateString([], { weekday: 'short' });
}

function formatShortDate(ts: number) {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatWeekLabel(weekStartTs: number) {
  const a = formatShortDate(weekStartTs);
  const b = formatShortDate(addDays(weekStartTs, 6));
  return `${a}–${b}`;
}

function BackPill({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.backBtn,
        { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Text style={styles.backIcon}>↩</Text>
    </Pressable>
  );
}

function SegmentPill({
  mode,
  onChange,
  width,
  height,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  width: number;
  height: number;
}) {
  const knobX = useRef(new Animated.Value(mode === 'week' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(knobX, {
      toValue: mode === 'week' ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, knobX]);

  const pad = 3;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const halfW = innerW / 2;

  const translateX = knobX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, halfW],
  });

  return (
    <View style={[styles.segmentWrap, { width, height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.segmentKnob,
          {
            width: halfW,
            height: innerH,
            borderRadius: innerH / 2,
            transform: [{ translateX }],
            left: pad,
            top: pad,
          },
        ]}
      />
      <Pressable style={styles.segmentHalf} onPress={() => onChange('week')}>
        <Text style={[styles.segmentText, mode === 'week' ? styles.segmentTextOn : styles.segmentTextOff]}>
          Week
        </Text>
      </Pressable>
      <Pressable style={styles.segmentHalf} onPress={() => onChange('month')}>
        <Text style={[styles.segmentText, mode === 'month' ? styles.segmentTextOn : styles.segmentTextOff]}>
          Month
        </Text>
      </Pressable>
    </View>
  );
}

function Bars({
  values,
  labels,
  width,
  height,
}: {
  values: number[];
  labels: string[];
  width: number;
  height: number;
}) {
  const max = Math.max(...values, 1);
  const gap = clamp(Math.round(width * 0.03), 10, 14);
  const barW = Math.floor((width - gap * (values.length - 1)) / values.length);

  return (
    <View style={{ width }}>
      <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
        {values.map((v, i) => {
          const h = Math.round((v / max) * height);
          return (
            <View key={String(i)} style={{ width: barW, marginRight: i === values.length - 1 ? 0 : gap }}>
              <Text style={styles.barNum}>{v}</Text>
              <View style={[styles.bar, { height: Math.max(8, h), borderRadius: 8 }]} />
            </View>
          );
        })}
      </View>

      <View style={{ height: 10 }} />

      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {labels.map((lab, i) => (
          <View
            key={`${lab}-${i}`}
            style={{
              width: barW,
              marginRight: i === labels.length - 1 ? 0 : gap,
              alignItems: 'center',
            }}
          >
            <Text style={styles.barLabel} numberOfLines={1}>
              {lab}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StatCard({ title, value, width }: { title: string; value: string; width: number }) {
  return (
    <View style={[styles.statCard, { width }]}>
      <Text style={styles.statTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function topByKey(list: CatchItem[], key: 'fish' | 'water') {
  const m = new Map<string, number>();
  for (const it of list) {
    const k = (it[key] || '').trim();
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  let best = '';
  let bestN = 0;
  for (const [k, n] of m.entries()) {
    if (n > bestN) {
      bestN = n;
      best = k;
    }
  }
  return bestN > 0 ? { label: best, count: bestN } : null;
}

function sameMonth(ts: number, year: number, monthIndex: number) {
  const d = new Date(ts);
  return d.getFullYear() === year && d.getMonth() === monthIndex;
}

function monthWeekStarts(nowTs: number) {
  const now = new Date(nowTs);
  const y = now.getFullYear();
  const m = now.getMonth();

  const firstDay = new Date(y, m, 1).getTime();
  const lastDay = new Date(y, m + 1, 0).getTime();

  let w = startOfWeekMonday(firstDay);
  const out: number[] = [];

  while (w <= lastDay) {
    out.push(w);
    w = addDays(w, 7);
  }

  return { year: y, monthIndex: m, weekStarts: out };
}

export default function StatsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTiny = height < 680 || width < 350;
  const isSmall = height < 740 || width < 380;

  const padX = clamp(Math.round(width * (isTiny ? 0.05 : isSmall ? 0.06 : 0.065)), 14, 28);

  const contentShift = 0;

  const [mode, setMode] = useState<Mode>('week');
  const [items, setItems] = useState<CatchItem[]>([]);

  const segW = clamp(Math.round(width * (isTiny ? 0.86 : isSmall ? 0.78 : 0.74)), 260, 360);
  const segH = clamp(Math.round(height * 0.06), 44, 52);

  const chartW = clamp(Math.round(width * (isTiny ? 0.92 : isSmall ? 0.88 : 0.82)), 280, 400);
  const chartH = clamp(Math.round(height * (isTiny ? 0.16 : isSmall ? 0.17 : 0.18)), 110, 160);

  const btnH = clamp(Math.round(height * (isTiny ? 0.06 : 0.065)), 44, 58);
  const btnW = clamp(Math.round(width * (isTiny ? 0.92 : isSmall ? 0.78 : 0.72)), 260, 380);

  const swap = useRef(new Animated.Value(1)).current;

  const runSwap = useCallback(() => {
    swap.setValue(0);
    Animated.timing(swap, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [swap]);

  const opacity = swap.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateY = swap.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setItems([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setItems([]);
        return;
      }

      const cleaned: CatchItem[] = parsed
        .map((x: any) => ({
          id: String(x?.id ?? ''),
          fish: String(x?.fish ?? ''),
          water: String(x?.water ?? ''),
          timeLabel: String(x?.timeLabel ?? ''),
          dateLabel: String(x?.dateLabel ?? ''),
          ts: Number(x?.ts ?? 0),
        }))
        .filter((x) => x.id && Number.isFinite(x.ts) && x.ts > 0);

      cleaned.sort((a, b) => b.ts - a.ts);
      setItems(cleaned);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation?.addListener?.('focus', () => load());
    return unsub;
  }, [load, navigation]);

  const onToggle = useCallback(
    (m: Mode) => {
      if (m === mode) return;
      setMode(m);
      runSwap();
    },
    [mode, runSwap],
  );

  const hasData = items.length > 0;

  const nowTs = Date.now();

  const weekData = useMemo(() => {
    const w0 = startOfWeekMonday(nowTs); 
    const labels = new Array(7).fill('').map((_, i) => formatShortDay(addDays(w0, i)));
    const values = new Array(7).fill(0);

    for (const c of items) {
      const d0 = startOfDay(c.ts);
      const diff = Math.floor((d0 - w0) / DAY);
      if (diff >= 0 && diff < 7) values[diff] += 1;
    }

    return { values, labels, rangeLabel: formatWeekLabel(w0) };
  }, [items, nowTs]);

  const monthData = useMemo(() => {
    const { year, monthIndex, weekStarts } = monthWeekStarts(nowTs);
    const values = new Array(weekStarts.length).fill(0);
    const labels = weekStarts.map((ws) => formatShortDate(ws));

    for (const c of items) {
      if (!sameMonth(c.ts, year, monthIndex)) continue;
      const ws = startOfWeekMonday(c.ts);
      const idx = weekStarts.findIndex((x) => x === ws);
      if (idx >= 0) values[idx] += 1;
    }

    const bestIdx = (() => {
      let bi = 0;
      let bv = -1;
      for (let i = 0; i < values.length; i++) {
        if (values[i] > bv) {
          bv = values[i];
          bi = i;
        }
      }
      return { idx: bi, val: Math.max(bv, 0) };
    })();

    const bestLabel = weekStarts[bestIdx.idx] ? formatWeekLabel(weekStarts[bestIdx.idx]) : '—';

    return {
      values,
      labels,
      bestText: bestIdx.val > 0 ? `${bestLabel} (${bestIdx.val})` : '—',
    };
  }, [items, nowTs]);

  const values = mode === 'week' ? weekData.values : monthData.values;
  const labels = mode === 'week' ? weekData.labels : monthData.labels;

  const totalAll = items.length;
  const totalInView = values.reduce((a, b) => a + b, 0);

  const topFish = useMemo(() => topByKey(items, 'fish'), [items]);
  const topWater = useMemo(() => topByKey(items, 'water'), [items]);

  const bestText = useMemo(() => {
    if (mode === 'week') {
      let bi = 0;
      let bv = -1;
      for (let i = 0; i < weekData.values.length; i++) {
        if (weekData.values[i] > bv) {
          bv = weekData.values[i];
          bi = i;
        }
      }
      const val = Math.max(bv, 0);
      const lab = weekData.labels[bi] || '—';
      return val > 0 ? `${lab} (${val})` : '—';
    }
    return monthData.bestText;
  }, [mode, monthData.bestText, weekData.labels, weekData.values]);

  const onShare = useCallback(async () => {
    try {
      const title = mode === 'week' ? `Week (${weekData.rangeLabel})` : 'Month';
      const msgLines = [
        `Fishing Angler Stats`,
        `${title}`,
        `Total in view: ${totalInView}`,
        `All time: ${totalAll}`,
        topFish ? `Top fish: ${topFish.label} (${topFish.count})` : `Top fish: —`,
        topWater ? `Top water: ${topWater.label} (${topWater.count})` : `Top water: —`,
        mode === 'week' ? `Best day: ${bestText}` : `Best week: ${bestText}`,
      ];
      await Share.share({ message: msgLines.join('\n') });
    } catch {}
  }, [bestText, mode, topFish, topWater, totalAll, totalInView, weekData.rangeLabel]);

  const avatarW = clamp(width * (isTiny ? 0.70 : isSmall ? 0.62 : 0.56), 220, 340);
  const avatarH = clamp(height * (isTiny ? 0.30 : isSmall ? 0.34 : 0.36), 210, 340);

  const statW = clamp(Math.round(chartW * 0.49), 130, 210);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.dim} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <View
          style={{
            flex: 1,
            paddingTop: insets.top,
            paddingHorizontal: padX,
            transform: [{ translateY: contentShift }],
          }}
        >
          <BackPill onPress={() => navigation.goBack()} />

          <View style={{ alignItems: 'center', marginTop: isSmall ? 6 : 10 }}>
            <SegmentPill mode={mode} onChange={onToggle} width={segW} height={segH} />
          </View>

          <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }], alignItems: 'center' }}>
            {!hasData ? (
              <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                <Text style={[styles.emptyTitle, { marginTop: isSmall ? 54 : 80 }]}>
                  Your statistics will be{'\n'}here!
                </Text>

                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Image source={AVATAR} style={{ width: avatarW, height: avatarH }} resizeMode="contain" />
                </View>

                <View style={{ paddingBottom: 18 + insets.bottom, width: '100%', alignItems: 'center' }}>
                  <Text style={styles.emptyHint}>Add catches in Log Catch to see charts.</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={{ marginTop: isSmall ? 24 : 34 }}>
                  <Bars values={values} labels={labels} width={chartW} height={chartH} />
                </View>

                <View style={{ height: 14 }} />

                <View style={{ width: chartW, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <StatCard title="Total in view" value={String(totalInView)} width={statW} />
                  <StatCard title="All time" value={String(totalAll)} width={statW} />
                </View>

                <View style={{ height: 10 }} />

                <View style={{ width: chartW, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <StatCard title="Top fish" value={topFish ? topFish.label : '—'} width={statW} />
                  <StatCard title="Top water" value={topWater ? topWater.label : '—'} width={statW} />
                </View>

                <View style={{ height: 10 }} />

                <View style={{ width: chartW }}>
                  <View style={[styles.statCard, { width: chartW }]}>
                    <Text style={styles.statTitle}>{mode === 'week' ? 'Best day' : 'Best week'}</Text>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {bestText}
                    </Text>
                  </View>
                </View>

                <View style={{ flex: 1 }} />

                <View style={{ paddingBottom: 18 + insets.bottom }}>
                  <Pressable
                    onPress={onShare}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      {
                        width: btnW,
                        height: btnH,
                        borderRadius: btnH / 2,
                        opacity: pressed ? 0.92 : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                      },
                    ]}
                  >
                    <Text style={styles.primaryBtnText}>Share</Text>
                    <Text style={[styles.primaryBtnText, { fontSize: 18 }]}>↗</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },

  backBtn: {
    width: 68,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(3,18,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  backIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },

  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3,18,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  segmentKnob: {
    position: 'absolute',
    backgroundColor: 'rgba(10,92,197,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  segmentHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontWeight: '900',
    fontSize: 13.5,
  },
  segmentTextOn: { color: '#FFFFFF' },
  segmentTextOff: { color: 'rgba(255,255,255,0.55)' },

  barNum: {
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '900',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 6,
  },
  bar: {
    backgroundColor: 'rgba(10,92,197,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  barLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '800',
    fontSize: 11,
  },

  statCard: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statTitle: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '900',
    fontSize: 12,
  },
  statValue: {
    marginTop: 6,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },

  primaryBtn: {
    backgroundColor: 'rgba(10,92,197,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 18,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  emptyTitle: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyHint: {
    color: 'rgba(255,255,255,0.62)',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
});