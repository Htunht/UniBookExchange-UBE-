import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

type StartupSplashOverlayProps = {
  onReady?: () => void;
};

export function StartupSplashOverlay({ onReady }: StartupSplashOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [started, setStarted] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const hasStarted = useRef(false);

  const handleLayout = useCallback(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    onReady?.();
    setStarted(true);
  }, [onReady]);

  useEffect(() => {
    if (!started) return;

    const listenerId = progress.addListener(({ value }) => {
      setPercentage(Math.round(value));
    });

    Animated.timing(progress, {
      toValue: 100,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start(({ finished: faded }) => {
        if (faded) setVisible(false);
      });
    });

    return () => {
      progress.removeListener(listenerId);
      progress.stopAnimation();
      opacity.stopAnimation();
    };
  }, [opacity, progress, started]);

  if (!visible) return null;

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      onLayout={handleLayout}
      pointerEvents="auto"
      style={[styles.overlay, { opacity }]}
    >
      <View style={styles.content}>
        <View style={styles.logoCard}>
          <Image
            source={require("../../assets/images/ube-logo.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>
        <Text style={styles.appName}>UniBookExchange</Text>
        <Text style={styles.appTagline}>ကျောင်းသုံးစာအုပ် အရောင်းအဝယ်နှင့် လဲလှယ်ရာ</Text>
        <Text style={styles.processing}>Processing...</Text>
        <View
          accessibilityLabel={`Loading ${percentage}%`}
          accessibilityRole="progressbar"
          style={styles.progressTrack}
        >
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    elevation: 1000,
    zIndex: 1000,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 95,
    height: 95,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appTagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  processing: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    marginTop: 32,
    marginBottom: 12,
  },
  progressTrack: {
    width: '72%',
    maxWidth: 280,
    height: 7,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  percentage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    fontVariant: ['tabular-nums'],
  },
});
