/**
 * Animated SVG weather icons. Pure react-native-svg + Animated (no Lottie deps).
 * Works in Expo Go AND production. Sharp at any size.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, {
  Circle, Path, G, Defs, RadialGradient, LinearGradient, Stop, Polygon, Ellipse,
} from 'react-native-svg';

/* ─── Animation helpers ──────────────────────────────────────────────── */

const useLoop = (toValue = 1, duration = 4000, easing = Easing.inOut(Easing.ease)) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue, duration, easing, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return v;
};

const useSpin = (duration = 30000) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  return v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
};

const useFall = (duration = 1500, delay = 0) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const start = () => {
      Animated.loop(
        Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
      ).start();
    };
    const t = setTimeout(start, delay);
    return () => clearTimeout(t);
  }, []);
  return v;
};

/* ─── Sub-shapes ─────────────────────────────────────────────────────── */

const SunBody = ({ s = 100, cx = 50, cy = 50, r = 18 }) => (
  <>
    <Defs>
      <RadialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
        <Stop offset="0%"   stopColor="#FFF59D" />
        <Stop offset="60%"  stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF9800" />
      </RadialGradient>
    </Defs>
    <Circle cx={cx} cy={cy} r={r} fill="url(#sunGrad)" />
  </>
);

const MoonBody = ({ cx = 50, cy = 50, r = 18 }) => (
  <>
    <Defs>
      <RadialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
        <Stop offset="0%"   stopColor="#F7FAFC" />
        <Stop offset="100%" stopColor="#CBD5E0" />
      </RadialGradient>
    </Defs>
    <Path
      d={`M ${cx + r * 0.5} ${cy - r * 0.95}
          A ${r} ${r} 0 1 0 ${cx + r * 0.5} ${cy + r * 0.95}
          A ${r * 0.85} ${r * 0.85} 0 1 1 ${cx + r * 0.5} ${cy - r * 0.95} Z`}
      fill="url(#moonGrad)"
    />
  </>
);

const CloudShape = ({ x = 50, y = 55, scale = 1, fill = '#F7FAFC' }) => {
  const s = scale;
  return (
    <Path
      d={`M ${x - 22 * s} ${y + 8 * s}
          C ${x - 32 * s} ${y + 8 * s} ${x - 32 * s} ${y - 10 * s} ${x - 18 * s} ${y - 8 * s}
          C ${x - 15 * s} ${y - 22 * s} ${x + 12 * s} ${y - 24 * s} ${x + 14 * s} ${y - 6 * s}
          C ${x + 26 * s} ${y - 8 * s} ${x + 30 * s} ${y + 8 * s} ${x + 18 * s} ${y + 8 * s} Z`}
      fill={fill}
      stroke="rgba(0,0,0,0.06)"
      strokeWidth="0.5"
    />
  );
};

/* ─── 1.  Sun (clear day) ────────────────────────────────────────────── */

const SunIcon = ({ size }) => {
  const rot = useSpin(40000);
  const pulse = useLoop(1, 3000);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ rotate: rot }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <G stroke="#FFC107" strokeWidth="3.5" strokeLinecap="round">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * Math.PI) / 6;
              const r1 = 28, r2 = 38;
              const x1 = 50 + Math.cos(angle) * r1;
              const y1 = 50 + Math.sin(angle) * r1;
              const x2 = 50 + Math.cos(angle) * r2;
              const y2 = 50 + Math.sin(angle) * r2;
              return <Path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} />;
            })}
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', transform: [{ scale }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <SunBody />
        </Svg>
      </Animated.View>
    </View>
  );
};

/* ─── 2.  Moon (clear night) ─────────────────────────────────────────── */

const MoonIcon = ({ size }) => {
  const twinkle1 = useLoop(1, 1800);
  const twinkle2 = useLoop(1, 2400);
  const opacity1 = twinkle1.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const opacity2 = twinkle2.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <MoonBody />
      </Svg>
      <Animated.View style={{ position: 'absolute', top: size * 0.15, left: size * 0.15, opacity: opacity1 }}>
        <Svg width={size * 0.18} height={size * 0.18} viewBox="0 0 20 20">
          <Polygon points="10,1 12,8 19,8 13.5,12.5 15.5,19 10,15 4.5,19 6.5,12.5 1,8 8,8" fill="#FFF" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', bottom: size * 0.20, right: size * 0.12, opacity: opacity2 }}>
        <Svg width={size * 0.14} height={size * 0.14} viewBox="0 0 20 20">
          <Polygon points="10,1 12,8 19,8 13.5,12.5 15.5,19 10,15 4.5,19 6.5,12.5 1,8 8,8" fill="#FFF" />
        </Svg>
      </Animated.View>
    </View>
  );
};

/* ─── 3.  Cloudy ─────────────────────────────────────────────────────── */

const CloudIcon = ({ size }) => {
  const drift = useLoop(1, 4500);
  const tx = drift.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ translateX: tx }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <CloudShape />
        </Svg>
      </Animated.View>
    </View>
  );
};

/* ─── 4.  Partly Cloudy (day) ────────────────────────────────────────── */

const PartlyCloudyDayIcon = ({ size }) => {
  const rot = useSpin(45000);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', top: -size * 0.05, left: size * 0.04, transform: [{ rotate: rot }] }}>
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 100 100">
          <G stroke="#FFC107" strokeWidth="4" strokeLinecap="round">
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI) / 4;
              const x1 = 50 + Math.cos(angle) * 26;
              const y1 = 50 + Math.sin(angle) * 26;
              const x2 = 50 + Math.cos(angle) * 36;
              const y2 = 50 + Math.sin(angle) * 36;
              return <Path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} />;
            })}
          </G>
          <SunBody />
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', bottom: -size * 0.02 }}>
        <Svg width={size * 0.95} height={size * 0.65} viewBox="0 0 100 70">
          <CloudShape x={50} y={40} scale={1.1} />
        </Svg>
      </View>
    </View>
  );
};

/* ─── 5.  Partly Cloudy (night) ──────────────────────────────────────── */

const PartlyCloudyNightIcon = ({ size }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', top: -size * 0.05, left: size * 0.04 }}>
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 100 100">
        <MoonBody />
      </Svg>
    </View>
    <View style={{ position: 'absolute', bottom: -size * 0.02 }}>
      <Svg width={size * 0.95} height={size * 0.65} viewBox="0 0 100 70">
        <CloudShape x={50} y={40} scale={1.1} fill="#E2E8F0" />
      </Svg>
    </View>
  </View>
);

/* ─── 6.  Rainy ──────────────────────────────────────────────────────── */

const RainDrop = ({ delay, x }) => {
  const fall = useFall(1400, delay);
  const ty = fall.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const opacity = fall.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0, 1, 1, 0] });
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: '55%', transform: [{ translateY: ty }], opacity }}>
      <Svg width={6} height={10} viewBox="0 0 6 10">
        <Path d="M 3 0 C 1 4 0 6 3 10 C 6 6 5 4 3 0 Z" fill="#63B3ED" />
      </Svg>
    </Animated.View>
  );
};

const RainyIcon = ({ size }) => (
  <View style={{ width: size, height: size, alignItems: 'center' }}>
    <Svg width={size} height={size * 0.7} viewBox="0 0 100 70" style={{ marginTop: size * 0.05 }}>
      <CloudShape x={50} y={40} scale={1} fill="#A0AEC0" />
    </Svg>
    <RainDrop delay={0}   x={size * 0.30} />
    <RainDrop delay={350} x={size * 0.46} />
    <RainDrop delay={700} x={size * 0.62} />
  </View>
);

/* ─── 7.  Snowy ──────────────────────────────────────────────────────── */

const SnowFlake = ({ delay, x }) => {
  const fall = useFall(2200, delay);
  const ty = fall.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const opacity = fall.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0, 1, 1, 0] });
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: '55%', transform: [{ translateY: ty }], opacity }}>
      <Svg width={8} height={8} viewBox="0 0 8 8">
        <G stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round">
          <Path d="M 4 0 L 4 8" />
          <Path d="M 0 4 L 8 4" />
          <Path d="M 1 1 L 7 7" />
          <Path d="M 7 1 L 1 7" />
        </G>
      </Svg>
    </Animated.View>
  );
};

const SnowyIcon = ({ size }) => (
  <View style={{ width: size, height: size, alignItems: 'center' }}>
    <Svg width={size} height={size * 0.7} viewBox="0 0 100 70" style={{ marginTop: size * 0.05 }}>
      <CloudShape x={50} y={40} scale={1} fill="#CBD5E0" />
    </Svg>
    <SnowFlake delay={0}    x={size * 0.30} />
    <SnowFlake delay={700}  x={size * 0.46} />
    <SnowFlake delay={1400} x={size * 0.62} />
  </View>
);

/* ─── 8.  Stormy / Thunder ───────────────────────────────────────────── */

const StormyIcon = ({ size }) => {
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const cycle = () => {
      Animated.sequence([
        Animated.delay(1500 + Math.random() * 2000),
        Animated.timing(flash, { toValue: 1, duration: 80,  useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 80,  useNativeDriver: true }),
        Animated.timing(flash, { toValue: 1, duration: 70,  useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => cycle());
    };
    cycle();
  }, []);
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <Svg width={size} height={size * 0.7} viewBox="0 0 100 70" style={{ marginTop: size * 0.05 }}>
        <CloudShape x={50} y={40} scale={1} fill="#4A5568" />
      </Svg>
      <Animated.View style={{ position: 'absolute', top: '60%', opacity: flash }}>
        <Svg width={size * 0.3} height={size * 0.4} viewBox="0 0 30 40">
          <Polygon
            points="15,0 5,20 13,20 9,40 24,15 16,15 22,0"
            fill="#FFEB3B"
            stroke="#F57F17"
            strokeWidth="1"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

/* ─── 9.  Fog ────────────────────────────────────────────────────────── */

const FogIcon = ({ size }) => {
  const fade1 = useLoop(1, 2500);
  const fade2 = useLoop(1, 3200);
  const op1 = fade1.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const op2 = fade2.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size * 0.6} viewBox="0 0 100 60">
        <Animated.View>
          <Path d="M 15 12 L 85 12" stroke="#CBD5E0" strokeWidth="6" strokeLinecap="round" fill="none" />
        </Animated.View>
      </Svg>
      <Animated.View style={{ position: 'absolute', opacity: op1 }}>
        <Svg width={size} height={size * 0.6} viewBox="0 0 100 60">
          <Path d="M 10 28 L 90 28" stroke="#E2E8F0" strokeWidth="6" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', opacity: op2 }}>
        <Svg width={size} height={size * 0.6} viewBox="0 0 100 60">
          <Path d="M 20 44 L 80 44" stroke="#CBD5E0" strokeWidth="6" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
};

/* ─── Public component — maps weather type to icon ───────────────────── */

const ICON_MAP = {
  sunny:         SunIcon,
  partly_cloudy: PartlyCloudyDayIcon,
  cloudy:        CloudIcon,
  fog:           FogIcon,
  rainy:         RainyIcon,
  snowy:         SnowyIcon,
  stormy:        StormyIcon,
  night:         MoonIcon,
};

const WeatherIcon = ({ type = 'sunny', size = 80, isDay = true }) => {
  let key = type;

  // partly cloudy at night → use moon + cloud variant
  if (!isDay && type === 'partly_cloudy') {
    return <PartlyCloudyNightIcon size={size} />;
  }
  if (!isDay && type === 'sunny') key = 'night';

  const IconComponent = ICON_MAP[key] ?? SunIcon;
  return <IconComponent size={size} />;
};

export default WeatherIcon;
