import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  StatusBar,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const BG = require('../assets/loader_bg.png');

const IC_LURE = require('../assets/ic_lure.png');
const IC_LOG = require('../assets/ic_log.png');
const IC_STATS = require('../assets/ic_stats.png');
const IC_STORIES = require('../assets/ic_stories.png');

const AVATAR = require('../assets/angler.png');

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

const TIPS: string[] = [
  'Fish are more active during low light — sunrise and sunset.',
  'Falling barometric pressure often triggers feeding.',
  'Wind pushes baitfish — fish usually follow.',
  'Change lure color before changing location.',
  'Slow down your retrieve in cold water.',
  'Match lure size to local baitfish.',
  'Structure holds fish — rocks, logs, drop-offs.',
  'After rain, fish edges of muddy water.',
  'Cloudy days are great for aggressive lures.',
  'Sharp hooks increase catch rate dramatically.',
  'Fish deeper during hot summer days.',
  'In spring, target shallow warming areas.',
  'Use natural colors in clear water.',
  'Use bright colors in murky water.',
  'Fish face into the current.',
  'Pause your lure — strikes often happen then.',
  'Early season fish bite slower presentations.',
  'Bigger lure doesn’t always mean bigger fish.',
  'Keep noise minimal in shallow water.',
  'Track your successful lure patterns.',
  'Moon phases can affect feeding behavior.',
  'After a cold front, fish go deeper.',
  'Smaller hooks improve natural presentation.',
  'Observe birds — they reveal bait activity.',
  'Fish the shade on sunny days.',
  'Change depth before changing spots.',
  'Keep line tight for better hook sets.',
  'Retrieve speed matters more than color sometimes.',
  'Fish often strike near structure edges.',
  'Data beats memory — log every catch.',
];

function pickRandomTip(except?: string) {
  if (TIPS.length <= 1) return TIPS[0] ?? '';
  let next = TIPS[Math.floor(Math.random() * TIPS.length)];
  if (except && TIPS.length > 1) {
    let guard = 0;
    while (next === except && guard < 10) {
      next = TIPS[Math.floor(Math.random() * TIPS.length)];
      guard += 1;
    }
  }
  return next;
}

export default function MainMenuScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isSmall = height < 720 || width < 360;

  const padX = clamp(Math.round(width * (isSmall ? 0.05 : 0.06)), 14, 26);
  const [tip, setTip] = useState<string>(() => pickRandomTip());
  const appear = useRef(new Animated.Value(0)).current;
  const heroPulse = useRef(new Animated.Value(0)).current;

  const runEntrance = useCallback(() => {
    appear.setValue(0);
    heroPulse.setValue(0);

    Animated.timing(appear, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroPulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [appear, heroPulse]);

  useFocusEffect(
    useCallback(() => {
      setTip((prev) => pickRandomTip(prev));
      runEntrance();
      return () => {
        heroPulse.stopAnimation();
      };
    }, [runEntrance, heroPulse]),
  );

  const heroW = width - padX * 2;
  const heroH = clamp(Math.round(height * (isSmall ? 0.20 : 0.23)), 142, 190);

  const rowH = clamp(Math.round(height * (isSmall ? 0.09 : 0.105)), 70, 92);
  const rowRadius = 999;

  const iconBox = clamp(rowH - 18, 50, 74);
  const iconSize = clamp(iconBox - 16, 26, 46);

  const shareH = clamp(Math.round(height * (isSmall ? 0.05 : 0.06)), 44, 58);
  const shareW = clamp(Math.round(heroW * (isSmall ? 0.58 : 0.52)), 190, 260);

  const avatarW = clamp(Math.round(width * (isSmall ? 0.24 : 0.28)), 86, 130);
  const avatarH = clamp(Math.round(avatarW * 1.45), 128, 190);

  const heroTranslate = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const listTranslate = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });

  const heroGlowOpacity = heroPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.34],
  });

  const heroGlowScale = heroPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const onShareTip = useCallback(async () => {
    try {
      await Share.share({
        message: `Pro Tips\n\n${tip}`,
      });
    } catch {}
  }, [tip]);

  const MenuRow = useCallback(
    ({
      title,
      icon,
      onPress,
      delay,
    }: {
      title: string;
      icon: any;
      onPress: () => void;
      delay: number;
    }) => {
      const rowIn = appear.interpolate({
        inputRange: [0, 1],
        outputRange: [22 + delay, 0],
      });

      const rowOpacity = appear.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });

      return (
        <Animated.View style={{ opacity: rowOpacity, transform: [{ translateY: rowIn }] }}>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.row,
              {
                height: rowH,
                borderRadius: rowRadius,
                paddingHorizontal: clamp(Math.round(width * (isSmall ? 0.05 : 0.06)), 14, 22),
                opacity: pressed ? 0.92 : 1,
                transform: [{ scale: pressed ? 0.992 : 1 }],
              },
            ]}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { width: iconBox, height: iconBox }]}>
                <Image source={icon} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
              </View>
              <Text style={[styles.rowTitle, { fontSize: isSmall ? 15 : 16 }]} numberOfLines={1}>
                {title}
              </Text>
            </View>

            <Text style={styles.chev}>›</Text>
          </Pressable>
        </Animated.View>
      );
    },
    [appear, iconBox, iconSize, isSmall, rowH, rowRadius, width],
  );

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.dim} pointerEvents="none" />

      <SafeAreaView style={[styles.safe, { paddingTop: insets.top + 10 }]}>
        <View style={{ paddingHorizontal: padX }}>
          <Animated.View
            style={[
              styles.hero,
              {
                width: heroW,
                height: heroH,
                borderRadius: 26,
                opacity: appear,
                transform: [{ translateY: heroTranslate }],
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heroGlow,
                {
                  opacity: heroGlowOpacity,
                  transform: [{ scale: heroGlowScale }],
                },
              ]}
            />

            <View style={styles.heroInner}>
              <View style={{ flex: 1, paddingRight: clamp(Math.round(width * 0.18), 76, 120) }}>
                <Text style={[styles.heroTitle, { fontSize: isSmall ? 18 : 20 }]}>Pro Tips</Text>

                <Text
                  style={[
                    styles.heroText,
                    {
                      fontSize: isSmall ? 13.5 : 15,
                      lineHeight: isSmall ? 18.5 : 20,
                      marginTop: isSmall ? 6 : 8,
                    },
                  ]}
                  numberOfLines={isSmall ? 3 : 3}
                >
                  {tip}
                </Text>

                <Pressable
                  onPress={onShareTip}
                  style={({ pressed }) => [
                    styles.heroBtn,
                    {
                      height: shareH,
                      width: shareW,
                      borderRadius: shareH / 2,
                      marginTop: clamp(Math.round(shareH * 0.22), 10, 14),
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.heroBtnText, { fontSize: isSmall ? 15 : 16 }]}>Share</Text>
                  <Text style={[styles.heroBtnIcon, { fontSize: isSmall ? 15 : 16 }]}>↗</Text>
                </Pressable>
              </View>

              <Image
                source={AVATAR}
                style={{
                  position: 'absolute',
                  right: 6,
                  bottom: -2,
                  width: avatarW,
                  height: avatarH,
                }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <Animated.View style={{ marginTop: isSmall ? 14 : 18, opacity: appear, transform: [{ translateY: listTranslate }] }}>
            <MenuRow title="Find fishing lure" icon={IC_LURE} onPress={() => navigation.navigate('FindFishingLure')} delay={0} />
            <View style={{ height: isSmall ? 12 : 14 }} />
            <MenuRow title="Log a Catch" icon={IC_LOG} onPress={() => navigation.navigate('LogCatch')} delay={3} />
            <View style={{ height: isSmall ? 12 : 14 }} />
            <MenuRow title="Stats" icon={IC_STATS} onPress={() => navigation.navigate('Stats')} delay={6} />
            <View style={{ height: isSmall ? 12 : 14 }} />
            <MenuRow title="Angler Stories" icon={IC_STORIES} onPress={() => navigation.navigate('AnglerStories')} delay={9} />
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

  hero: {
    borderWidth: 1,
    borderColor: 'rgba(120,210,255,0.35)',
    backgroundColor: 'rgba(3, 18, 42, 0.55)',
    overflow: 'hidden',
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(120,210,255,0.14)',
  },
  heroInner: {
    flex: 1,
    padding: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },
  heroText: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    textAlign: 'center',
  },
  heroBtn: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(10, 92, 197, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  heroBtnIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginTop: Platform.OS === 'android' ? -1 : 0,
  },

  row: {
    borderWidth: 1,
    borderColor: 'rgba(120,210,255,0.30)',
    backgroundColor: 'rgba(3, 18, 42, 0.45)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  chev: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 26,
    fontWeight: '900',
    paddingRight: 14,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },
});