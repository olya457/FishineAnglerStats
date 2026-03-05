import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  StatusBar,
  Platform,
  useWindowDimensions,
  Animated,
  Easing,
  Share,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BG = require('../assets/loader_bg.png');

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function RowButton({
  title,
  leftIcon,
  right,
  onPress,
  width,
  height,
  isSmall,
}: {
  title: string;
  leftIcon: string;
  right?: React.ReactNode;
  onPress?: () => void;
  width: number;
  height: number;
  isSmall: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.rowCard,
        {
          width,
          height,
          borderRadius: height / 2,
          paddingHorizontal: isSmall ? 14 : 18,
          opacity: pressed ? 0.93 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        },
      ]}
    >
      <Text style={[styles.rowLeftIcon, { fontSize: isSmall ? 15 : 16 }]}>{leftIcon}</Text>
      <Text style={[styles.rowTitle, { fontSize: isSmall ? 13 : 14 }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ flex: 1 }} />
      {right ? <View style={{ marginLeft: 12 }}>{right}</View> : null}
    </Pressable>
  );
}

const KEY_VIBRATION = 'settings_vibration_v1';
const KEY_NOTIF = 'settings_notifications_v1';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTiny = height < 680 || width < 350;
  const isSmall = height < 740 || width < 380;

  const padX = clamp(Math.round(width * (isTiny ? 0.05 : isSmall ? 0.06 : 0.065)), 14, 28);
  const contentShift = isTiny ? -6 : isSmall ? -12 : -18;

  const rowW = width - padX * 2;
  const rowH = clamp(Math.round(height * (isTiny ? 0.072 : isSmall ? 0.078 : 0.082)), 54, 66);
  const gap = isTiny ? 12 : isSmall ? 14 : 16;

  const [vibrationOn, setVibrationOn] = useState(true);
  const [notifOn, setNotifOn] = useState(false);

  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const opacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] });

  const load = useCallback(async () => {
    try {
      const a = await AsyncStorage.getItem(KEY_VIBRATION);
      const b = await AsyncStorage.getItem(KEY_NOTIF);
      if (a != null) setVibrationOn(a === '1');
      if (b != null) setNotifOn(b === '1');
    } catch {}
  }, []);

  const saveVibration = useCallback(async (v: boolean) => {
    try {
      await AsyncStorage.setItem(KEY_VIBRATION, v ? '1' : '0');
    } catch {}
  }, []);

  const saveNotif = useCallback(async (v: boolean) => {
    try {
      await AsyncStorage.setItem(KEY_NOTIF, v ? '1' : '0');
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onShare = useCallback(async () => {
    try {
      await Share.share({ message: 'Fishine Angler Stats' });
    } catch {}
  }, []);

  const switchScale = useMemo(() => {
    if (Platform.OS === 'ios') return isTiny ? 0.86 : isSmall ? 0.9 : 0.92;
    return isTiny ? 0.96 : 1.0;
  }, [isTiny, isSmall]);

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
          <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }, { scale }] }}>
            <View style={{ height: isTiny ? 16 : isSmall ? 22 : 28 }} />

            <RowButton
              title="Share"
              leftIcon="🔗"
              width={rowW}
              height={rowH}
              onPress={onShare}
              isSmall={isSmall}
            />

            <View style={{ height: gap }} />

            <RowButton
              title="Vibration"
              leftIcon="📳"
              width={rowW}
              height={rowH}
              isSmall={isSmall}
              right={
                <View style={{ transform: [{ scale: switchScale }] }}>
                  <Switch
                    value={vibrationOn}
                    onValueChange={(v) => {
                      setVibrationOn(v);
                      saveVibration(v);
                    }}
                    trackColor={{ false: 'rgba(255,255,255,0.20)', true: 'rgba(10,92,197,0.95)' }}
                    thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                  />
                </View>
              }
            />

            <View style={{ height: gap }} />

            <RowButton
              title="Notification"
              leftIcon="🔔"
              width={rowW}
              height={rowH}
              isSmall={isSmall}
              right={
                <View style={{ transform: [{ scale: switchScale }] }}>
                  <Switch
                    value={notifOn}
                    onValueChange={(v) => {
                      setNotifOn(v);
                      saveNotif(v);
                    }}
                    trackColor={{ false: 'rgba(255,255,255,0.20)', true: 'rgba(10,92,197,0.95)' }}
                    thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                  />
                </View>
              }
            />

            <View style={{ flex: 1 }} />
            <View style={{ height: 12 + insets.bottom }} />
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
    backgroundColor: 'rgba(0,0,0,0.10)',
  },

  rowCard: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLeftIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginRight: 14,
    marginTop: Platform.OS === 'android' ? -1 : 0,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});