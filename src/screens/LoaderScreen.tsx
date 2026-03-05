import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;
const BG = require('../assets/loader_bg.png');
const LOGO = require('../assets/logo.png');

const WEB_MS = 3000;  
const LOGO_MS = 2000; 
const TOTAL_MS = WEB_MS + LOGO_MS;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function LoaderScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmall = height < 700 || width < 360;
  const [phase, setPhase] = useState<0 | 1>(0);

  const o1 = useRef(new Animated.Value(0)).current;
  const o2 = useRef(new Animated.Value(0)).current;
  const o3 = useRef(new Animated.Value(0)).current;
  const o4 = useRef(new Animated.Value(0)).current;
  const o5 = useRef(new Animated.Value(0)).current;
  const o6 = useRef(new Animated.Value(0)).current;
  const o7 = useRef(new Animated.Value(0)).current;
  const o8 = useRef(new Animated.Value(0)).current;
  const o9 = useRef(new Animated.Value(0)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;

  const squareSize = useMemo(() => {
    return clamp(Math.round(Math.min(width, height) * 0.022), isSmall ? 8 : 10, isSmall ? 10 : 12);
  }, [width, height, isSmall]);

  const gap = useMemo(() => {
    return clamp(Math.round(squareSize * 1.6), 12, 18);
  }, [squareSize]);

  const gridSize = useMemo(() => {
    return squareSize * 3 + gap * 2;
  }, [squareSize, gap]);

  const logoW = useMemo(() => {
    return clamp(Math.round(width * (isSmall ? 0.42 : 0.48)), 150, 240);
  }, [width, isSmall]);

  useEffect(() => {
    const makePulse = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 675,
            delay,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.2,
            duration: 675,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );

    const loops = [
      makePulse(o1, 0),
      makePulse(o2, 75),
      makePulse(o3, 150),
      makePulse(o4, 225),
      makePulse(o5, 300),
      makePulse(o6, 375),
      makePulse(o7, 450),
      makePulse(o8, 525),
      makePulse(o9, 600),
    ];

    loops.forEach((l) => l.start());

    const t1 = setTimeout(() => {
      setPhase(1);
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, WEB_MS);

    const t2 = setTimeout(() => {
      navigation.replace('Onboarding');
    }, TOTAL_MS);

    return () => {
      loops.forEach((l) => l.stop());
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigation, logoOpacity, logoScale, o1, o2, o3, o4, o5, o6, o7, o8, o9]);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          {phase === 0 ? (
            <View style={[styles.gridWrap, { width: gridSize, height: gridSize }]}>
              <Square opacity={o1} size={squareSize} x={-gap} y={-gap} />
              <Square opacity={o2} size={squareSize} x={0} y={-gap} />
              <Square opacity={o3} size={squareSize} x={gap} y={-gap} />

              <Square opacity={o4} size={squareSize} x={-gap} y={0} />
              <Square opacity={o5} size={squareSize} x={0} y={0} />
              <Square opacity={o6} size={squareSize} x={gap} y={0} />

              <Square opacity={o7} size={squareSize} x={-gap} y={gap} />
              <Square opacity={o8} size={squareSize} x={0} y={gap} />
              <Square opacity={o9} size={squareSize} x={gap} y={gap} />
            </View>
          ) : (
            <Animated.View
              style={[
                styles.logoWrap,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Image
                source={LOGO}
                style={{
                  width: logoW,
                  height: Math.round(logoW * 0.6),
                }}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>

      <View style={styles.dim} pointerEvents="none" />
    </ImageBackground>
  );
}

function Square({
  opacity,
  size,
  x,
  y,
}: {
  opacity: Animated.Value;
  size: number;
  x: number;
  y: number;
}) {
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: size,
        height: size,
        marginLeft: -size / 2 + x,
        marginTop: -size / 2 + y,
        borderRadius: Math.max(2, Math.round(size * 0.22)),
        backgroundColor: '#DDDDDD',
        opacity,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          },
          android: {
            elevation: 2,
          },
        }),
      }}
    />
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  gridWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});