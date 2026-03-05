import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  StatusBar,
  Platform,
  useWindowDimensions,
  ScrollView,
  Share,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANGLER_STORIES, type AnglerStory } from '../data/anglerStories';

const BG = require('../assets/loader_bg.png');

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type Phase = 'list' | 'read';

function BackPill({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.backBtn,
        { 
          opacity: pressed ? 0.9 : 1, 
          transform: [{ scale: pressed ? 0.98 : 1 }] 
        },
      ]}
    >
      <Text style={styles.backIcon}>↩</Text>
    </Pressable>
  );
}

function SharePill({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.shareBtn,
        { 
          opacity: pressed ? 0.9 : 1, 
          transform: [{ scale: pressed ? 0.98 : 1 }] 
        },
      ]}
    >
      <Text style={styles.shareIcon}>↗</Text>
    </Pressable>
  );
}

export default function AnglerStoriesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallH = height < 720;
  const isSmallW = width < 360;
  const isSmall = isSmallH || isSmallW;

  const padX = clamp(Math.round(width * (isSmall ? 0.05 : 0.06)), 14, 26);
  const contentShift = 0;

  const cardW = width - padX * 2;
  const cardRadius = 18;

  const itemH = clamp(Math.round(height * (isSmall ? 0.10 : 0.105)), 70, 90);
  const itemRadius = Math.round(itemH / 2);

  const readCardW = cardW;
  const readCardMaxH = clamp(Math.round(height * (isSmall ? 0.70 : 0.72)), 420, 640);
  const topGap = clamp(Math.round(height * (isSmall ? 0.012 : 0.018)), 8, 16);

  const [phase, setPhase] = useState<Phase>('list');
  const [selectedId, setSelectedId] = useState<string>(ANGLER_STORIES[0]?.id ?? 's1');

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

  const opacity = anim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [0, 1] 
  });
  const translateY = anim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [14, 0] 
  });
  const scale = anim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [0.99, 1] 
  });

  const selectedStory = useMemo<AnglerStory>(() => {
    const found = ANGLER_STORIES.find((story) => story.id === selectedId);
    return found || ANGLER_STORIES[0];
  }, [selectedId]);

  const onBack = useCallback(() => {
    if (phase === 'read') {
      setPhase('list');
      runSwap();
      return;
    }
    navigation.goBack();
  }, [navigation, phase, runSwap]);

  const openStory = useCallback(
    (id: string) => {
      setSelectedId(id);
      setPhase('read');
      runSwap();
    },
    [runSwap],
  );

  const onShare = useCallback(async () => {
    try {
      await Share.share({
        message: selectedStory.title + "\n\n" + selectedStory.content,
      });
    } catch (error) {
    }
  }, [selectedStory]);

  const hasStories = ANGLER_STORIES && ANGLER_STORIES.length > 0;

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
          <View style={styles.topRow}>
            <BackPill onPress={onBack} />
            {phase === 'read' ? (
              <SharePill onPress={onShare} />
            ) : (
              <View style={{ width: 68 }} />
            )}
          </View>

          <Animated.View 
            style={{ 
              flex: 1, 
              opacity: opacity, 
              transform: [{ translateY: translateY }, { scale: scale }] 
            }}
          >
            {!hasStories ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.emptyTitle}>No stories found</Text>
                <Text style={styles.emptySub}>
                  Check src/data/anglerStories.ts export: ANGLER_STORIES
                </Text>
              </View>
            ) : phase === 'list' ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 22 + insets.bottom }}
              >
                <View style={{ marginTop: isSmall ? 8 : 12 }}>
                  {ANGLER_STORIES.map((story) => (
                    <Pressable
                      key={story.id}
                      onPress={() => openStory(story.id)}
                      style={({ pressed }) => [
                        styles.storyItem,
                        {
                          width: cardW,
                          minHeight: itemH,
                          borderRadius: itemRadius,
                          opacity: pressed ? 0.93 : 1,
                          transform: [{ scale: pressed ? 0.995 : 1 }],
                          paddingHorizontal: isSmall ? 14 : 18,
                          paddingVertical: isSmall ? 12 : 14,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={[styles.itemTitle, { fontSize: isSmall ? 12.2 : 13.5 }]}
                        >
                          {story.title}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={[
                            styles.itemPreview,
                            {
                              fontSize: isSmall ? 10.8 : 11.5,
                              lineHeight: isSmall ? 14 : 15,
                              marginTop: isSmall ? 5 : 6,
                            },
                          ]}
                        >
                          {story.preview}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={{ height: topGap }} />

                <View style={{ alignItems: 'center' }}>
                  <View style={[styles.readCardOuter, { width: readCardW, borderRadius: cardRadius }]}>
                    <View
                      style={[
                        styles.readCardInner,
                        {
                          borderRadius: cardRadius - 2,
                          maxHeight: readCardMaxH,
                          paddingHorizontal: isSmall ? 14 : 16,
                          paddingVertical: isSmall ? 12 : 14,
                        },
                      ]}
                    >
                      <Text style={[styles.readTitle, { fontSize: isSmall ? 13.2 : 14.5 }]}>
                        {selectedStory.title}
                      </Text>

                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 12 }}
                        style={{ marginTop: isSmall ? 8 : 10 }}
                      >
                        <Text style={[styles.readBody, { fontSize: isSmall ? 11.0 : 12.0 }]}>
                          {selectedStory.content}
                        </Text>
                      </ScrollView>
                    </View>
                  </View>
                </View>

                <View style={{ flex: 1 }} />
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
    backgroundColor: 'rgba(0,0,0,0.10)',
  },

  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  },
  backIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },

  shareBtn: {
    width: 68,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(3,18,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },

  storyItem: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 14,
    justifyContent: 'center',
  },
  itemTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },
  itemPreview: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '700',
    textAlign: 'center',
  },

  readCardOuter: {
    backgroundColor: 'rgba(10,92,197,0.10)',
    borderWidth: 2,
    borderColor: 'rgba(10,92,197,0.70)',
    padding: 8,
  },
  readCardInner: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  readTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'left',
  },
  readBody: {
    color: 'rgba(255,255,255,0.76)',
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'left',
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 22,
    lineHeight: 16,
  },
});