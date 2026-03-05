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
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LURE_QUESTIONS, type OptionKey } from '../data/lureQuestions';

const BG = require('../assets/loader_bg.png');
const AVATAR = require('../assets/angler.png');
const IMG_SPINNER = require('../assets/lure_spinnerbait.png');
const IMG_WORM = require('../assets/lure_worm.png');
const IMG_CRANK = require('../assets/lure_crankbait.png');
const IMG_POPPER = require('../assets/lure_popper.png');

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type Phase = 'intro' | 'quiz' | 'result';
type LureKey = 'spinnerbait' | 'worm' | 'crankbait' | 'popper';

type LureResult = {
  key: LureKey;
  title: string;
  bestFor: string;
  waterType: string;
  depth: string;
  description: string;
  why: string;
  tip: string;
  image: any;
};

const RESULTS: Record<LureKey, LureResult> = {
  spinnerbait: {
    key: 'spinnerbait',
    title: 'Spinnerbait',
    bestFor: 'Bass, Pike',
    waterType: 'Murky or windy conditions',
    depth: 'Shallow to mid-depth',
    description: 'A spinnerbait features a wire frame with one or more spinning metal blades that create flash and vibration in the water. This vibration mimics distressed baitfish and triggers aggressive strikes.',
    why: 'The rotating blades reflect light and produce vibrations that help fish locate the lure even in low visibility water.',
    tip: 'Retrieve at a steady pace, but occasionally pause or change speed to trigger reaction bites.',
    image: IMG_SPINNER,
  },
  worm: {
    key: 'worm',
    title: 'Soft Plastic Worm',
    bestFor: 'Bass',
    waterType: 'Clear to slightly stained',
    depth: 'Bottom fishing',
    description: 'Soft plastic worms imitate natural prey like worms or small baitfish. They are extremely versatile and can be rigged in multiple ways (Texas rig, Carolina rig, wacky rig).',
    why: 'Its lifelike movement and subtle action make it ideal when fish are less aggressive.',
    tip: 'Slow down your presentation in colder water and focus on structure like rocks or submerged wood.',
    image: IMG_WORM,
  },
  crankbait: {
    key: 'crankbait',
    title: 'Crankbait',
    bestFor: 'Bass, Walleye',
    waterType: 'Clear to moderately stained',
    depth: 'Mid to deep',
    description: 'Crankbaits are hard-bodied lures with a diving lip that allows them to reach specific depths. They imitate small fish and produce strong movement underwater.',
    why: 'Their wobbling action triggers reaction strikes, especially when bounced off structure.',
    tip: 'Choose diving depth according to where fish are holding — deeper during hot or cold conditions.',
    image: IMG_CRANK,
  },
  popper: {
    key: 'popper',
    title: 'Topwater Popper',
    bestFor: 'Bass',
    waterType: 'Calm water',
    depth: 'Surface',
    description: 'Topwater poppers float and create splashing sounds when jerked. They imitate injured baitfish struggling at the surface.',
    why: 'Surface strikes are highly aggressive and often explosive, especially during early morning or evening.',
    tip: 'Use short jerks with pauses — many strikes happen during the pause.',
    image: IMG_POPPER,
  },
};

function decideResult(answers: OptionKey[]): LureKey {
  const score: Record<OptionKey, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const a of answers) score[a] += 1;
  const pairs = (Object.keys(score) as OptionKey[]).map((k) => [k, score[k]] as const);
  pairs.sort((p1, p2) => p2[1] - p1[1]);
  const top = pairs[0]?.[0] ?? 'A';
  if (top === 'A') return 'spinnerbait';
  if (top === 'B') return 'worm';
  if (top === 'C') return 'crankbait';
  return 'popper';
}

const QUESTIONS_PER_LEVEL = 3;
const TOTAL_LEVELS = 10;

export default function FindFishingLureScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isSmall = height < 720 || width < 360;

  const padX = clamp(Math.round(width * (isSmall ? 0.05 : 0.06)), 14, 26);

  const [phase, setPhase] = useState<Phase>('intro');
  const [level, setLevel] = useState(0);
  const [stepInLevel, setStepInLevel] = useState(0);
  const [answers, setAnswers] = useState<OptionKey[]>([]);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [resultKey, setResultKey] = useState<LureKey>('spinnerbait');

  const anim = useRef(new Animated.Value(1)).current;

  const runSwap = useCallback(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const cardW = width - padX * 2;
  const cardRadius = 18;

  const optionH = clamp(Math.round(height * (isSmall ? 0.055 : 0.058)), 44, 54);
  const optionRadius = Math.round(optionH / 2);

  const btnH = clamp(Math.round(height * (isSmall ? 0.05 : 0.055)), 42, 56);
  const btnW = clamp(Math.round(cardW * (isSmall ? 0.74 : 0.76)), 210, 330);
  const btnRadius = Math.round(btnH / 2);

  const bottomPad = (isSmall ? 18 : 26) + insets.bottom;

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] });

  const globalIndex = level * QUESTIONS_PER_LEVEL + stepInLevel;
  const currentQ = useMemo(() => LURE_QUESTIONS[globalIndex], [globalIndex]);

  const onBack = useCallback(() => {
    if (phase === 'intro') {
      navigation.goBack();
    } else {
      setPhase('intro');
      setLevel(0);
      setStepInLevel(0);
      setAnswers([]);
      setSelected(null);
      runSwap();
    }
  }, [navigation, phase, runSwap]);

  const onStart = useCallback(() => {
    setPhase('quiz');
    setLevel(0);
    setStepInLevel(0);
    setAnswers([]);
    setSelected(null);
    runSwap();
  }, [runSwap]);

  const goForward = useCallback(
    (chosen: OptionKey) => {
      const nextAnswers = [...answers];
      nextAnswers[globalIndex] = chosen;
      const last = globalIndex >= TOTAL_LEVELS * QUESTIONS_PER_LEVEL - 1;

      if (last) {
        const r = decideResult(nextAnswers);
        setAnswers(nextAnswers);
        setResultKey(r);
        setPhase('result');
        setSelected(null);
        runSwap();
        return;
      }

      setAnswers(nextAnswers);
      if (stepInLevel < QUESTIONS_PER_LEVEL - 1) {
        setStepInLevel(stepInLevel + 1);
      } else {
        setLevel(level + 1);
        setStepInLevel(0);
      }
      setSelected(null);
      runSwap();
    },
    [answers, globalIndex, level, runSwap, stepInLevel],
  );

  const onNext = useCallback(() => {
    if (!selected) return;
    goForward(selected);
  }, [goForward, selected]);

  const result = RESULTS[resultKey];

  const onShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${result.title}\n\nBest for: ${result.bestFor}\nWater Type: ${result.waterType}\nDepth: ${result.depth}\n\nDescription: ${result.description}\n\nWhy it works: ${result.why}\n\nPro Tip: ${result.tip}`,
      });
    } catch {}
  }, [result]);

  const onRestart = useCallback(() => {
    setPhase('intro');
    setLevel(0);
    setStepInLevel(0);
    setAnswers([]);
    setSelected(null);
    setResultKey('spinnerbait');
    runSwap();
  }, [runSwap]);

  const progressText = `Level ${level + 1}/${TOTAL_LEVELS}`;
  const resultImageH = clamp(Math.round(height * (isSmall ? 0.18 : 0.22)), 110, 170);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.dim} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, paddingHorizontal: padX }}>
          
          <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 0 : 20 }]}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                styles.backBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.backIcon}>↩</Text>
            </Pressable>
          </View>

          <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }, { scale }] }}>
            {phase === 'intro' && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.introText}>Click "Start Selection"{"\n"}to find the perfect bait!</Text>
                
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Image
                    source={AVATAR}
                    style={{
                      width: clamp(Math.round(width * (isSmall ? 0.65 : 0.75)), 230, 360),
                      height: clamp(Math.round(height * (isSmall ? 0.45 : 0.55)), 260, 420),
                    }}
                    resizeMode="contain"
                  />
                  <View style={{ marginTop: -30 }}>
                    <Pressable
                      onPress={onStart}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        {
                          height: btnH,
                          width: btnW,
                          borderRadius: btnRadius,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.primaryBtnText, { fontSize: isSmall ? 15 : 16 }]}>
                        Start selection
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <View style={{ height: bottomPad }} />
              </View>
            )}

            {phase === 'quiz' && (
              <View style={{ flex: 1 }}>
                <View style={{ alignItems: 'center', marginBottom: 15 }}>
                  <Text style={[styles.progressText, { fontSize: isSmall ? 12 : 13 }]}>{progressText}</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <View style={[styles.qCard, { width: cardW, borderRadius: cardRadius }]}>
                    <Text style={[styles.qText, { fontSize: isSmall ? 12.5 : 13.5 }]}>
                      {currentQ.title}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 20 }}>
                  {currentQ.options.map((o) => {
                    const active = selected === o.key;
                    return (
                      <Pressable
                        key={`${currentQ.id}-${o.key}`}
                        onPress={() => setSelected(o.key)}
                        style={({ pressed }) => [
                          styles.option,
                          {
                            height: optionH,
                            borderRadius: optionRadius,
                            width: btnW,
                            alignSelf: 'center',
                            opacity: pressed ? 0.92 : 1,
                            backgroundColor: active ? 'rgba(10,92,197,0.95)' : 'rgba(3,18,42,0.55)',
                            borderColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(120,210,255,0.28)',
                          },
                        ]}
                      >
                        <Text style={[styles.optionText, { fontSize: isSmall ? 13 : 14 }]}>
                          {o.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ marginTop: 10 }}>
                  <Pressable
                    onPress={onNext}
                    disabled={!selected}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      {
                        height: btnH,
                        width: btnW,
                        borderRadius: btnRadius,
                        alignSelf: 'center',
                        opacity: !selected ? 0.55 : pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.primaryBtnText, { fontSize: isSmall ? 15 : 16 }]}>
                      {level === TOTAL_LEVELS - 1 && stepInLevel === QUESTIONS_PER_LEVEL - 1 ? 'Finish' : 'Next'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {phase === 'result' && (
              <View style={{ flex: 1 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.resultTitle, { fontSize: isSmall ? 17 : 18 }]}>{result.title}</Text>
                  <View style={[styles.resultCard, { width: cardW, borderRadius: 18 }]}>
                    <Image
                      source={result.image}
                      style={{
                        width: cardW - 36,
                        height: resultImageH,
                        alignSelf: 'center',
                        borderRadius: 12,
                        marginTop: 14,
                      }}
                      resizeMode="contain"
                    />
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={{ marginTop: 10 }}
                      contentContainerStyle={{ paddingBottom: 14 }}
                    >
                      <Text style={styles.resultLine}><Text style={styles.resultBold}>Best for: </Text>{result.bestFor}</Text>
                      <Text style={styles.resultLine}><Text style={styles.resultBold}>Water Type: </Text>{result.waterType}</Text>
                      <Text style={styles.resultLine}><Text style={styles.resultBold}>Depth: </Text>{result.depth}</Text>
                      <Text style={[styles.resultSection, { marginTop: 10 }]}><Text style={styles.resultBold}>Description: </Text>{result.description}</Text>
                      <Text style={[styles.resultSection, { marginTop: 10 }]}><Text style={styles.resultBold}>Why it works: </Text>{result.why}</Text>
                      <Text style={[styles.resultSection, { marginTop: 10 }]}><Text style={styles.resultBold}>Pro Tip: </Text>{result.tip}</Text>
                    </ScrollView>
                  </View>
                </View>
                <View style={{ flex: 1 }} />
                <View style={{ paddingBottom: bottomPad, gap: 10 }}>
                  <Pressable
                    onPress={onShare}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      {
                        height: btnH,
                        width: btnW,
                        borderRadius: btnRadius,
                        alignSelf: 'center',
                        opacity: pressed ? 0.92 : 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 10,
                      },
                    ]}
                  >
                    <Text style={[styles.primaryBtnText, { fontSize: isSmall ? 15 : 16 }]}>Share</Text>
                    <Text style={[styles.primaryBtnText, { fontSize: isSmall ? 17 : 18 }]}>↗</Text>
                  </Pressable>
                  <Pressable
                    onPress={onRestart}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      {
                        height: btnH,
                        width: btnW,
                        borderRadius: btnRadius,
                        alignSelf: 'center',
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.secondaryBtnText, { fontSize: isSmall ? 15 : 16 }]}>Start again</Text>
                  </Pressable>
                </View>
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
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  header: {
    height: 60,
    justifyContent: 'center',
    marginBottom: 10,
  },
  backBtn: {
    width: 60,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(3,18,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },
  progressText: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '900',
    textAlign: 'center',
  },
  introText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  avatarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qCard: {
    backgroundColor: 'rgba(3,18,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  qText: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 18,
  },
  option: {
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  optionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: 'rgba(10,92,197,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(3,18,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(120,210,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.86)',
    fontWeight: '900',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultCard: {
    backgroundColor: 'rgba(3,18,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  resultLine: {
    color: 'rgba(255,255,255,0.84)',
    fontWeight: '600',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 6,
  },
  resultSection: {
    color: 'rgba(255,255,255,0.84)',
    fontWeight: '600',
    fontSize: 12.5,
    lineHeight: 18,
  },
  resultBold: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});