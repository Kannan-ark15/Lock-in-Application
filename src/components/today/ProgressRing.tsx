// src/components/today/ProgressRing.tsx
// Animated circular progress ring showing daily completion percentage.
// Uses RN's built-in Animated (not Reanimated) for SVG strokeDashoffset
// to avoid the createAnimatedComponent + react-native-svg compatibility gap on Android.

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors, typography } from '@/constants/theme';

const RADIUS       = 52;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE_WIDTH) * 2 + 4;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  pct: number;
}

function getStatusColor(pct: number): string {
  if (pct >= 100) return colors.accent.success;
  if (pct >= 50)  return colors.accent.primary;
  return colors.accent.warning;
}

function getStatusText(pct: number): string {
  if (pct === 0)  return 'Not started';
  if (pct < 50)   return 'In progress';
  if (pct < 100)  return 'Almost there';
  return 'Complete!';
}

export function ProgressRing({ pct }: Props) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: Math.min(100, Math.max(0, pct)) / 100,
      duration: 700,
      useNativeDriver: false, // strokeDashoffset is not supported by native driver
    }).start();
  }, [pct]);

  const strokeDashoffset = animVal.interpolate({
    inputRange:  [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const color = getStatusColor(pct);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </LinearGradient>
        </Defs>

        {/* Track circle */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />

        {/* Progress arc */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="url(#ringGrad)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      {/* Center label — absolutely positioned over the SVG */}
      <View style={styles.centerLabel}>
        <Text style={[styles.pctText, { color }]}>{Math.round(pct)}%</Text>
        <Text style={styles.statusText}>{getStatusText(pct)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  pctText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: -1,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    letterSpacing: 0.3,
    marginTop: -2,
  },
});
