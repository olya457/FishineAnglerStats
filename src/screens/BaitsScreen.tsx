import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  StatusBar,
  useWindowDimensions,
  ScrollView,
  Share,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BAITS, type BaitId } from '../data/baits';

const BACKGROUND_IMAGE = require('../assets/loader_bg.png');

const BAIT_IMAGES: Record<BaitId, any> = {
  spinnerbait: require('../assets/spinnerbait.png'),
  soft_plastic_worm: require('../assets/soft_plastic_worm.png'),
  crankbait: require('../assets/crankbait.png'),
  topwater_popper: require('../assets/topwater_popper.png'),
  jerkbait: require('../assets/jerkbait.png'),
  jig: require('../assets/jig.png'),
  swimbait: require('../assets/swimbait.png'),
  spoon: require('../assets/spoon.png'),
  buzzbait: require('../assets/buzzbait.png'),
  blade_bait: require('../assets/blade_bait.png'),
  frog_lure: require('../assets/frog_lure.png'),
  lipless_crankbait: require('../assets/lipless_crankbait.png'),
  tube_bait: require('../assets/tube_bait.png'),
  inline_spinner: require('../assets/inline_spinner.png'),
  chatterbait: require('../assets/chatterbait.png'),
  carolina_rig: require('../assets/carolina_rig.png'),
  drop_shot_rig: require('../assets/drop_shot_rig.png'),
  glide_bait: require('../assets/glide_bait.png'),
  crawfish_imitation: require('../assets/crawfish_imitation.png'),
  umbrella_rig: require('../assets/umbrella_rig.png'),
};

function clampValue(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type AppPhase = 'list' | 'detail';

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navigationButton,
        { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <Text style={styles.navigationButtonText}>↩</Text>
    </Pressable>
  );
}

function ShareButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navigationButton,
        { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <Text style={styles.navigationButtonText}>⤴︎</Text>
    </Pressable>
  );
}

function ActionButton({ title, onPress, width, height }: { title: string; onPress: () => void; width: number; height: number; }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryActionButton,
        { width, height, borderRadius: height / 2, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Text style={styles.primaryActionButtonText}>{title}</Text>
    </Pressable>
  );
}

export default function BaitsScreen({ navigation }: any) {
  const safeAreaInsets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isSmallScreen = windowHeight < 720;
  const sidePadding = clampValue(windowWidth * 0.05, 16, 24);
  const contentWidth = windowWidth - sidePadding * 2;
  
  const BOTTOM_NAV_HEIGHT = 85; 

  const imageListHeight = isSmallScreen ? 160 : 200;
  const imageDetailHeight = isSmallScreen ? windowHeight * 0.22 : windowHeight * 0.28;

  const [currentPhase, setCurrentPhase] = useState<AppPhase>('list');
  const [selectedBaitId, setSelectedBaitId] = useState<BaitId>(BAITS[0]?.id);

  const fadeAnimation = useRef(new Animated.Value(1)).current;

  const startTransition = useCallback(() => {
    fadeAnimation.setValue(0);
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeAnimation]);

  const currentBait = useMemo(() => {
    return BAITS.find((item) => item.id === selectedBaitId) || BAITS[0];
  }, [selectedBaitId]);

  const handleOpenBait = (id: BaitId) => {
    setSelectedBaitId(id);
    setCurrentPhase('detail');
    startTransition();
  };

  const handleBackAction = () => {
    if (currentPhase === 'detail') {
      setCurrentPhase('list');
      startTransition();
    } else {
      navigation.goBack();
    }
  };

  const pickRandomBait = () => {
    const randomIndex = Math.floor(Math.random() * BAITS.length);
    handleOpenBait(BAITS[randomIndex].id);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${currentBait.title}\n\n${currentBait.description}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.backgroundImage} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlayDimmer} pointerEvents="none" />

      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, paddingHorizontal: sidePadding }}>
          
          <View style={styles.headerWrapper}>
            {currentPhase === 'detail' ? (
              <View style={styles.topNavigationHeader}>
                <BackButton onPress={handleBackAction} />
                <ShareButton onPress={handleShare} />
              </View>
            ) : (
              <View style={styles.mainTitleContainer}>
                <Text style={styles.mainTitleText}>Baits</Text>
                <View style={styles.titleUnderline} />
              </View>
            )}
          </View>

          <Animated.View style={{ flex: 1, opacity: fadeAnimation }}>
            {currentPhase === 'list' ? (
              <View style={{ flex: 1 }}>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 20 }}
                >
                  {BAITS.map((bait) => (
                    <Pressable key={bait.id} onPress={() => handleOpenBait(bait.id)} style={styles.baitListCard}>
                      <View style={[styles.baitCardImageContainer, { height: imageListHeight }]}>
                        <Image 
                          source={BAIT_IMAGES[bait.imageKey]} 
                          style={styles.fullImage} 
                          resizeMode="cover" 
                        />
                      </View>
                      <View style={styles.baitCardTitleContainer}>
                        <Text style={styles.baitCardTitleText}>{bait.title}</Text>
                      </View>
                    </Pressable>
                  ))}
                  
                  <View style={{ marginTop: 10, marginBottom: 20 }}>
                    <ActionButton 
                      title="PICK RANDOM" 
                      onPress={pickRandomBait} 
                      width={contentWidth * 0.8} 
                      height={50} 
                    />
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View style={{ 
                flex: 1, 
                marginBottom: BOTTOM_NAV_HEIGHT + safeAreaInsets.bottom 
              }}>
                <Text style={styles.detailScreenHeader}>{currentBait.title}</Text>

                <View style={styles.detailCardOuter}>
                  <View style={[styles.detailImageWrapper, { height: imageDetailHeight }]}>
                    <Image 
                      source={BAIT_IMAGES[currentBait.imageKey]} 
                      style={styles.fullImage} 
                      resizeMode="cover" 
                    />
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                  >
                    <Text style={styles.infoLabel}>BEST FOR:</Text>
                    <Text style={styles.infoValue}>{currentBait.bestFor}</Text>

                    <Text style={styles.infoLabel}>DEPTH:</Text>
                    <Text style={styles.infoValue}>{currentBait.depth}</Text>

                    <View style={styles.separatorLine} />

                    <Text style={styles.descriptionHeader}>Description</Text>
                    <Text style={styles.descriptionBody}>{currentBait.description}</Text>

                    <Text style={styles.descriptionHeader}>Why it works</Text>
                    <Text style={styles.descriptionBody}>{currentBait.whyItWorks}</Text>

                    <View style={styles.proTipHighlightBox}>
                      <Text style={styles.proTipTitle}>PRO TIP</Text>
                      <Text style={styles.proTipText}>{currentBait.proTip}</Text>
                    </View>
                  </ScrollView>
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
  backgroundImage: { flex: 1, backgroundColor: '#000' },
  safeContainer: { flex: 1 },
  overlayDimmer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  headerWrapper: { height: 70, justifyContent: 'center' },
  mainTitleContainer: { alignItems: 'center', justifyContent: 'center' },
  mainTitleText: { 
    color: '#FFF', 
    fontSize: 26, 
    fontWeight: '800', 
    letterSpacing: 1.5,
  },
  titleUnderline: { 
    height: 3, 
    width: 40, 
    backgroundColor: '#0a5cc5', 
    marginTop: 2,
    borderRadius: 2
  },
  topNavigationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navigationButton: {
    width: 50,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(10,92,197,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  navigationButtonText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  baitListCard: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  baitCardImageContainer: { width: '100%', backgroundColor: '#FFF' },
  fullImage: { width: '100%', height: '100%' },
  baitCardTitleContainer: { paddingVertical: 18, paddingHorizontal: 10 },
  baitCardTitleText: { color: '#FFF', fontWeight: '900', textAlign: 'center', fontSize: 16, textTransform: 'uppercase' },
  primaryActionButton: { backgroundColor: '#0a5cc5', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  primaryActionButtonText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  detailScreenHeader: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 15, textTransform: 'uppercase' },
  detailCardOuter: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.75)', 
    borderRadius: 25, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(10,92,197,0.4)',
  },
  detailImageWrapper: { backgroundColor: '#FFF', width: '100%' },
  infoLabel: { color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: 11, marginTop: 10 },
  infoValue: { color: '#4dabff', fontWeight: '900', fontSize: 15, marginBottom: 5 },
  separatorLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  descriptionHeader: { color: '#FFF', fontWeight: '900', fontSize: 16, marginBottom: 6 },
  descriptionBody: { color: 'rgba(255,255,255,0.7)', lineHeight: 22, marginBottom: 20, fontSize: 14 },
  proTipHighlightBox: { 
    backgroundColor: 'rgba(10,92,197,0.2)', 
    padding: 15, 
    borderRadius: 15, 
    borderLeftWidth: 4, 
    borderLeftColor: '#0a5cc5' 
  },
  proTipTitle: { color: '#4dabff', fontWeight: '900', fontSize: 12, marginBottom: 4 },
  proTipText: { color: '#FFF', fontStyle: 'italic', lineHeight: 20, fontSize: 14 },
});