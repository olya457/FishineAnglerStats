// src/screens/OnboardingScreen.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  Animated,
  useWindowDimensions,
  StatusBar,
  Platform,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const BG = require('../assets/loader_bg.png');

const ON1 = require('../assets/onboard1.png');
const ON2 = require('../assets/onboard2.png');
const ON3 = require('../assets/onboard3.png');
const ON4 = require('../assets/onboard4.png');

type Slide = {
  key: string;
  image: any;
  title: string;
  desc: string;
  cta: string;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isSmall = height < 720 || width < 360;

  const slides: Slide[] = useMemo(
    () => [
      {
        key: '1',
        image: ON1,
        title: 'Track Every Catch',
        desc:
          'Log your fish with weight,\nlength, and lure in seconds.\nBuild your personal fishing\nhistory effortlessly.',
        cta: 'Next',
      },
      {
        key: '2',
        image: ON2,
        title: 'See Your Fishing\nPatterns',
        desc:
          'Discover weekly and monthly\ntrends.\nFind out which lures work best\nfor you.',
        cta: 'Next',
      },
      {
        key: '3',
        image: ON3,
        title: 'Smarter Lure\nSuggestions',
        desc:
          'Get personalized lure\nrecommendations\nbased on your own catch data.',
        cta: 'Next',
      },
      {
        key: '4',
        image: ON4,
        title: 'Stay Ready for the Next\nCatch',
        desc:
          'Set reminders, enable alerts,\nand never miss your fishing\nsession.',
        cta: "Let’s Start",
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const slide = slides[index];

  const anim = useRef(new Animated.Value(1)).current;

  const padX = clamp(Math.round(width * (isSmall ? 0.05 : 0.06)), 14, 26);

  const topExtraOffset = 40;

  const topImgW = clamp(Math.round(width * (isSmall ? 0.78 : 0.82)), 240, 420);
  const topImgH = Math.round(topImgW * (isSmall ? 0.9 : 0.98));

  const cardW = width - padX * 2;
  const cardPad = clamp(Math.round(width * (isSmall ? 0.05 : 0.055)), 14, 22);
  const cardRadius = 22;

  const btnH = clamp(Math.round(height * (isSmall ? 0.052 : 0.055)), 44, 56);
  const btnRadius = Math.round(btnH / 2);
  const btnW = clamp(Math.round(cardW * (isSmall ? 0.74 : 0.78)), 210, 320);

  const topBlockPaddingTop = Platform.OS === 'android' ? insets.top + 6 : 8;
  const topImageTop = topBlockPaddingTop + (isSmall ? 6 : 18) + topExtraOffset;
  const imageBottomY = topImageTop + topImgH;

  const cardTop = Math.round(imageBottomY - 2);

  const bottomSafety = 26 + insets.bottom;
  const estimatedCardH = isSmall ? 240 : 265;
  const cardTopSafe = Math.min(cardTop, height - bottomSafety - estimatedCardH);

  const runSwap = useCallback(
    (nextIndex: number) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setIndex(nextIndex);
        Animated.timing(anim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    },
    [anim],
  );

  const onPressCTA = useCallback(() => {
    if (index < slides.length - 1) {
      runSwap(index + 1);
    } else {
      navigation.replace('MainTabs');
    }
  }, [index, navigation, runSwap, slides.length]);

  const imgOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const imgTranslateY = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const imgScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] });

  const cardOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const cardTranslateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.dim} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <View style={{ width, height }}>
          <View style={{ paddingTop: topBlockPaddingTop, alignItems: 'center' }}>
            <Animated.Image
              source={slide.image}
              style={{
                width: topImgW,
                height: topImgH,
                marginTop: (isSmall ? 6 : 18) + topExtraOffset,
                opacity: imgOpacity,
                transform: [{ translateY: imgTranslateY }, { scale: imgScale }],
              }}
              resizeMode="contain"
            />
          </View>

          <View
            style={{
              position: 'absolute',
              left: padX,
              right: padX,
              top: cardTopSafe,
            }}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  width: cardW,
                  borderRadius: cardRadius,
                  padding: cardPad,
                  paddingBottom: cardPad + 6,
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslateY }],
                },
              ]}
            >
              <Text
                style={[
                  styles.h1,
                  { fontSize: isSmall ? 20 : 22, lineHeight: isSmall ? 24 : 26 },
                ]}
              >
                {slide.title}
              </Text>

              <Text
                style={[
                  styles.p,
                  {
                    marginTop: isSmall ? 10 : 12,
                    fontSize: isSmall ? 13 : 14,
                    lineHeight: isSmall ? 18 : 20,
                  },
                ]}
              >
                {slide.desc}
              </Text>

              <View style={styles.btnRow}>
                <Pressable
                  onPress={onPressCTA}
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      height: btnH,
                      width: btnW,
                      borderRadius: btnRadius,
                      marginTop: clamp(Math.round(cardPad * 0.75), 10, 16),
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.btnText, { fontSize: isSmall ? 17 : 18 }]}>
                    {slide.cta}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
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

  card: {
    backgroundColor: 'rgba(4, 16, 38, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  h1: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },
  p: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    textAlign: 'center',
  },

  btnRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  btn: {
    backgroundColor: '#0A5CC5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});