// src/screens/LogCatchScreen.tsx
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
  FlatList,
  Alert,
  Animated,
  Easing,
  PanResponder,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

const BG = require('../assets/loader_bg.png');
const AVATAR = require('../assets/angler.png');

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type CatchItem = {
  id: string;
  fish: string;
  water: string;
  timeLabel: string;
  dateLabel: string;
  ts: number;
};

const STORAGE_KEY = 'catches_v1';

const FISH_OPTIONS = [
  'Largemouth Bass',
  'Smallmouth Bass',
  'Northern Pike',
  'Walleye',
  'Rainbow Trout',
  'Brown Trout',
  'Common Carp',
  'Channel Catfish',
  'Yellow Perch',
  'Atlantic Salmon',
];

const WATER_OPTIONS = ['River', 'Lake', 'Pond', 'Reservoir', 'Ocean'];

function uuid() {
  return `${Date.now()}-${Math.random()}`;
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

function PrimaryButton({
  title,
  onPress,
  width,
  height,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  width: number;
  height: number;
  disabled?: boolean;
  style?: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        {
          width,
          height,
          borderRadius: height / 2,
          opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        style,
      ]}
    >
      <Text style={styles.primaryBtnText}>{title}</Text>
    </Pressable>
  );
}

type SwipeRowProps = {
  item: CatchItem;
  rowW: number;
  rowH: number;
  onDeleteConfirmed: () => void;
};

function SwipeRow({ item, rowW, rowH, onDeleteConfirmed }: SwipeRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);

  const actionW = clamp(rowW * 0.22, 86, 112);
  const maxLeft = -actionW;
  const openThreshold = maxLeft * 0.55;

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.timing(translateX, {
        toValue,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        isOpenRef.current = toValue !== 0;
      });
    },
    [translateX],
  );

  const close = useCallback(() => animateTo(0), [animateTo]);
  const open = useCallback(() => animateTo(maxLeft), [animateTo, maxLeft]);

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete?', 'Are you sure you want to delete your entry?', [
      { text: 'Cancel', style: 'cancel', onPress: () => close() },
      { text: 'Delete', style: 'destructive', onPress: onDeleteConfirmed },
    ]);
  }, [close, onDeleteConfirmed]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        const dx = Math.abs(gesture.dx);
        const dy = Math.abs(gesture.dy);
        return dx > 8 && dx > dy;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_evt, gesture) => {
        let next = gesture.dx;
        if (isOpenRef.current) next = maxLeft + gesture.dx;
        if (next > 0) next = next * 0.22;
        if (next < maxLeft) next = maxLeft;
        translateX.setValue(next);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const finalX = isOpenRef.current ? maxLeft + gesture.dx : gesture.dx;
        if (finalX < openThreshold) open();
        else close();
      },
      onPanResponderTerminate: () => close(),
    }),
  ).current;

  return (
    <View style={{ width: rowW, height: rowH, marginBottom: 14 }}>
      <View style={[styles.deleteBg, { width: rowW, height: rowH, borderRadius: 18 }]}>
        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              width: actionW,
              height: rowH,
              borderTopRightRadius: 18,
              borderBottomRightRadius: 18,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={styles.trash}>🗑</Text>
        </Pressable>
      </View>

      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.catchRow,
          { width: rowW, height: rowH, borderRadius: 18, transform: [{ translateX }] },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.catchFish}>{item.fish}</Text>
          <Text style={styles.catchWater}>{item.water}</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.catchTime}>{item.timeLabel}</Text>
          <Text style={styles.catchDate}>{item.dateLabel}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onClose,
  onPick,
  maxW,
  isSmall,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string | null;
  onClose: () => void;
  onPick: (v: string) => void;
  maxW: number;
  isSmall: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            {
              width: maxW,
              paddingVertical: isSmall ? 10 : 12,
              paddingHorizontal: isSmall ? 12 : 14,
              maxHeight: 520,
            },
          ]}
          onPress={() => {}}
        >
          <Text style={[styles.modalTitle, { fontSize: isSmall ? 13 : 14 }]}>{title}</Text>
          <View style={{ height: 10 }} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const active = selected === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => onPick(opt)}
                  style={({ pressed }) => [
                    styles.modalRow,
                    {
                      opacity: pressed ? 0.92 : 1,
                      backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.modalRowText, { fontSize: isSmall ? 12.5 : 13 }]}>{opt}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function IOSDatePickerModal({
  visible,
  title,
  mode,
  value,
  onClose,
  onPick,
  maxW,
  isSmall,
}: {
  visible: boolean;
  title: string;
  mode: 'date' | 'time';
  value: Date;
  onClose: () => void;
  onPick: (d: Date) => void;
  maxW: number;
  isSmall: boolean;
}) {
  const [temp, setTemp] = useState<Date>(value);

  useEffect(() => {
    if (visible) setTemp(value);
  }, [visible, value]);

  const onChange = useCallback((e: DateTimePickerEvent, d?: Date) => {
    if (e.type === 'dismissed') return;
    if (d) setTemp(d);
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.pickerCard,
            {
              width: maxW,
              paddingVertical: isSmall ? 10 : 12,
              paddingHorizontal: isSmall ? 12 : 14,
            },
          ]}
          onPress={() => {}}
        >
          <Text style={[styles.modalTitle, { fontSize: isSmall ? 13 : 14 }]}>{title}</Text>
          <View style={{ height: 10 }} />
          <View style={{ alignItems: 'center' }}>
            <DateTimePicker
              value={temp}
              mode={mode}
              display="spinner"
              onChange={onChange}
              themeVariant="dark"
              textColor="#FFFFFF"
              style={{ width: '100%' }}
            />
          </View>
          <View style={{ height: 12 }} />
          <PrimaryButton
            title={mode === 'time' ? 'Add time' : 'Add date'}
            onPress={() => {
              onPick(temp);
              onClose();
            }}
            width={clamp(maxW * 0.92, 240, 380)}
            height={clamp(isSmall ? 46 : 52, 44, 58)}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type Phase = 'list' | 'form';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatTimeLabelFromHM(h: number, m: number) {
  const hh = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${hh}:${pad2(m)} ${ampm}`;
}

function buildAndroidTimeOptions(stepMinutes: number) {
  const out: { label: string; h: number; m: number }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      out.push({ label: formatTimeLabelFromHM(h, m), h, m });
    }
  }
  return out;
}

function buildAndroidDateOptions(daysForward: number) {
  const out: { label: string; date: Date }[] = [];
  const base = new Date();
  base.setHours(12, 0, 0, 0);

  for (let i = 0; i <= daysForward; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);

    let label = d.toLocaleDateString([], { month: 'long', day: 'numeric' });
    if (i === 0) label = `Today • ${label}`;
    if (i === 1) label = `Tomorrow • ${label}`;

    out.push({ label, date: d });
  }
  return out;
}

export default function LogCatchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTiny = height < 680 || width < 350;
  const isSmall = height < 740 || width < 380;

  const padX = clamp(width * (isTiny ? 0.05 : isSmall ? 0.06 : 0.065), 14, 28);
  const rowW = width - padX * 2;

  const rowH = clamp(height * (isTiny ? 0.088 : 0.095), 64, 82);
  const btnH = clamp(height * (isTiny ? 0.06 : 0.065), 44, 58);
  const btnW = clamp(rowW * (isTiny ? 0.92 : isSmall ? 0.86 : 0.8), 250, 380);

  const contentShift = -10;

  const avatarW = clamp(width * (isTiny ? 0.78 : isSmall ? 0.72 : 0.66), 230, 380);
  const avatarH = clamp(height * (isTiny ? 0.42 : isSmall ? 0.46 : 0.5), 240, 430);

  const fieldH = clamp(height * (isTiny ? 0.07 : 0.075), 54, 66);

  const [phase, setPhase] = useState<Phase>('list');
  const [items, setItems] = useState<CatchItem[]>([]);

  const [fish, setFish] = useState<string | null>(null);
  const [water, setWater] = useState<string | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [date, setDate] = useState<Date | null>(null);

  const [fishModal, setFishModal] = useState(false);
  const [waterModal, setWaterModal] = useState(false);

  const [timeModalIOS, setTimeModalIOS] = useState(false);
  const [dateModalIOS, setDateModalIOS] = useState(false);

  const [androidTimeModal, setAndroidTimeModal] = useState(false);
  const [androidDateModal, setAndroidDateModal] = useState(false);

  const androidTimeOptions = useMemo(() => buildAndroidTimeOptions(15), []);
  const androidDateOptions = useMemo(() => buildAndroidDateOptions(14), []);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(12)).current;

  const runEnter = useCallback(() => {
    fade.setValue(0);
    lift.setValue(12);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, lift]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setItems([]);
        return;
      }
      const parsed = JSON.parse(raw) as CatchItem[];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  const save = useCallback(async (list: CatchItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, []);

  useEffect(() => {
    load();
    runEnter();
    const unsub = navigation?.addListener?.('focus', () => {
      load();
    });
    return unsub;
  }, [load, navigation, runEnter]);

  const resetForm = useCallback(() => {
    setFish(null);
    setWater(null);
    setTime(null);
    setDate(null);
    setFishModal(false);
    setWaterModal(false);
    setTimeModalIOS(false);
    setDateModalIOS(false);
    setAndroidTimeModal(false);
    setAndroidDateModal(false);
  }, []);

  const openForm = useCallback(() => {
    resetForm();
    setPhase('form');
    runEnter();
  }, [resetForm, runEnter]);

  const goBack = useCallback(() => {
    if (phase === 'form') {
      setPhase('list');
      runEnter();
      return;
    }
    navigation.goBack();
  }, [navigation, phase, runEnter]);

  const formatTime = useCallback((d: Date) => {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, []);

  const formatDate = useCallback((d: Date) => {
    return d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  const canSave = useMemo(() => {
    return Boolean(fish && water && time && date);
  }, [fish, water, time, date]);

  const addCatch = useCallback(() => {
    if (!fish || !water || !time || !date) return;

    const merged = new Date(date);
    merged.setHours(time.getHours());
    merged.setMinutes(time.getMinutes());
    merged.setSeconds(0);
    merged.setMilliseconds(0);

    const newItem: CatchItem = {
      id: uuid(),
      fish,
      water,
      timeLabel: formatTime(merged),
      dateLabel: formatDate(merged),
      ts: merged.getTime(),
    };

    const next = [newItem, ...items].sort((a, b) => b.ts - a.ts);
    setItems(next);
    save(next);

    setPhase('list');
    runEnter();
  }, [date, fish, formatDate, formatTime, items, runEnter, save, time, water]);

  const deleteCatch = useCallback(
    (id: string) => {
      const next = items.filter((x) => x.id !== id);
      setItems(next);
      save(next);
    },
    [items, save],
  );

  const pickCardW = clamp(rowW, 300, 420);

  const Field = useCallback(
    (params: { label: string; value: string; onPress: () => void; rightChevron?: boolean }) => {
      const { label, value, onPress, rightChevron } = params;
      return (
        <View style={{ marginTop: isTiny ? 14 : 16 }}>
          <Text style={[styles.fieldLabel, { fontSize: isTiny ? 12 : 13 }]}>{label}</Text>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.fieldPill,
              {
                height: fieldH,
                borderRadius: fieldH / 2,
                width: rowW,
                opacity: pressed ? 0.93 : 1,
                paddingHorizontal: isTiny ? 14 : 16,
              },
            ]}
          >
            <Text style={[styles.fieldValue, { fontSize: isTiny ? 12.5 : 13 }]} numberOfLines={1}>
              {value}
            </Text>
            {rightChevron ? <Text style={styles.chev}>⌄</Text> : null}
          </Pressable>
        </View>
      );
    },
    [fieldH, isTiny, rowW],
  );

  const onPickTime = useCallback(() => {
    if (Platform.OS === 'ios') setTimeModalIOS(true);
    else setAndroidTimeModal(true);
  }, []);

  const onPickDate = useCallback(() => {
    if (Platform.OS === 'ios') setDateModalIOS(true);
    else setAndroidDateModal(true);
  }, []);

  const timeValueLabel = useMemo(() => {
    if (!time) return 'Add time';
    if (Platform.OS === 'android') {
      const h = time.getHours();
      const m = time.getMinutes();
      return formatTimeLabelFromHM(h, m);
    }
    return formatTime(time);
  }, [formatTime, time]);

  const dateValueLabel = useMemo(() => {
    if (!date) return 'Add date';
    if (Platform.OS === 'android') {
      return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
    }
    return formatDate(date);
  }, [date, formatDate]);

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
          <BackPill onPress={goBack} />

          <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: lift }] }}>
            {phase === 'list' ? (
              <>
                {items.length === 0 ? (
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.emptyText, { marginTop: isTiny ? 44 : isSmall ? 56 : 80 }]}>
                      You haven't added any{'\n'}catches yet.
                    </Text>

                    <View style={styles.avatarWrap}>
                      <Image source={AVATAR} resizeMode="contain" style={{ width: avatarW, height: avatarH }} />
                    </View>

                    <View style={{ paddingBottom: 18 + insets.bottom }}>
                      <PrimaryButton
                        title="Add Catch"
                        onPress={openForm}
                        width={btnW}
                        height={btnH}
                        style={{ transform: [{ translateY: -30 }] }}
                      />
                    </View>
                  </View>
                ) : (
                  <FlatList
                    data={items}
                    keyExtractor={(i) => i.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 22 + insets.bottom }}
                    ListHeaderComponent={
                      <View style={{ marginBottom: 14 }}>
                        <PrimaryButton title="Add Catch" onPress={openForm} width={btnW} height={btnH} />
                      </View>
                    }
                    renderItem={({ item }) => (
                      <SwipeRow item={item} rowW={rowW} rowH={rowH} onDeleteConfirmed={() => deleteCatch(item.id)} />
                    )}
                  />
                )}
              </>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={{ height: isTiny ? 8 : 12 }} />

                {Field({
                  label: 'Fish name',
                  value: fish ?? 'Choose a fish',
                  onPress: () => setFishModal(true),
                  rightChevron: true,
                })}

                {Field({
                  label: 'Water',
                  value: water ?? 'Choose water',
                  onPress: () => setWaterModal(true),
                  rightChevron: true,
                })}

                {Field({
                  label: 'Time',
                  value: timeValueLabel,
                  onPress: onPickTime,
                  rightChevron: Platform.OS === 'android',
                })}

                {Field({
                  label: 'Date',
                  value: dateValueLabel,
                  onPress: onPickDate,
                  rightChevron: Platform.OS === 'android',
                })}

                <View style={{ flex: 1 }} />

                <View style={{ paddingBottom: 18 + insets.bottom }}>
                  <PrimaryButton
                    title="Add Catch"
                    onPress={addCatch}
                    width={btnW}
                    height={btnH}
                    disabled={!canSave}
                    style={{ transform: [{ translateY: -30 }] }}
                  />
                </View>

                <PickerModal
                  visible={fishModal}
                  title="Fish name"
                  options={FISH_OPTIONS}
                  selected={fish}
                  onClose={() => setFishModal(false)}
                  onPick={(v) => {
                    setFish(v);
                    setFishModal(false);
                  }}
                  maxW={pickCardW}
                  isSmall={isSmall}
                />

                <PickerModal
                  visible={waterModal}
                  title="Water"
                  options={WATER_OPTIONS}
                  selected={water}
                  onClose={() => setWaterModal(false)}
                  onPick={(v) => {
                    setWater(v);
                    setWaterModal(false);
                  }}
                  maxW={pickCardW}
                  isSmall={isSmall}
                />

                {Platform.OS === 'ios' ? (
                  <>
                    <IOSDatePickerModal
                      visible={timeModalIOS}
                      title="Time"
                      mode="time"
                      value={time ?? new Date()}
                      onClose={() => setTimeModalIOS(false)}
                      onPick={(d) => setTime(d)}
                      maxW={pickCardW}
                      isSmall={isSmall}
                    />

                    <IOSDatePickerModal
                      visible={dateModalIOS}
                      title="Date"
                      mode="date"
                      value={date ?? new Date()}
                      onClose={() => setDateModalIOS(false)}
                      onPick={(d) => setDate(d)}
                      maxW={pickCardW}
                      isSmall={isSmall}
                    />
                  </>
                ) : null}

                {Platform.OS === 'android' ? (
                  <>
                    <PickerModal
                      visible={androidTimeModal}
                      title="Time"
                      options={androidTimeOptions.map((x) => x.label)}
                      selected={
                        time ? formatTimeLabelFromHM(time.getHours(), time.getMinutes()) : null
                      }
                      onClose={() => setAndroidTimeModal(false)}
                      onPick={(label) => {
                        const found = androidTimeOptions.find((x) => x.label === label);
                        if (!found) return;
                        const t = new Date();
                        t.setHours(found.h, found.m, 0, 0);
                        setTime(t);
                        setAndroidTimeModal(false);
                      }}
                      maxW={pickCardW}
                      isSmall={isSmall}
                    />

                    <PickerModal
                      visible={androidDateModal}
                      title="Date"
                      options={androidDateOptions.map((x) => x.label)}
                      selected={date ? date.toLocaleDateString([], { month: 'long', day: 'numeric' }) : null}
                      onClose={() => setAndroidDateModal(false)}
                      onPick={(label) => {
                        const found = androidDateOptions.find((x) => x.label === label);
                        if (!found) return;
                        setDate(found.date);
                        setAndroidDateModal(false);
                      }}
                      maxW={pickCardW}
                      isSmall={isSmall}
                    />
                  </>
                ) : null}
              </View>
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

  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },

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
    fontSize: 18,
    fontWeight: '900',
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },

  emptyText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },

  avatarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryBtn: {
    backgroundColor: 'rgba(10,92,197,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 18,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trash: {
    fontSize: 18,
  },

  catchRow: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  catchFish: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  catchWater: {
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    fontWeight: '700',
  },
  catchTime: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
  },
  catchDate: {
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    fontWeight: '700',
  },

  fieldLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '800',
    marginBottom: 10,
  },
  fieldPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    flex: 1,
    paddingRight: 10,
  },
  chev: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '900',
    fontSize: 16,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
  },
  pickerCard: {
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },
  modalRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  modalRowText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800',
  },
});