import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

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
        <View style={styles.logo}>
          <Text style={styles.logoText}>UBE</Text>
        </View>
        <Text style={styles.appName}>UniBookExchange</Text>
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
    backgroundColor: '#208AEF',
    elevation: 1000,
    zIndex: 1000,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 18,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.3,
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
