import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function ShowdownOverlay({ winners }) {
  const [seconds, setSeconds] = useState(5);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (winners && winners.length > 0) {
      // Entrance Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      // Countdown Timer
      const timer = setInterval(() => {
        setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [winners]);

  if (!winners || winners.length === 0) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.headerText}>SHOWDOWN</Text>

        <View style={styles.trophyContainer}>
          <View style={styles.divider} />
          <Text style={styles.winnerTitle}>WINNER</Text>
          <View style={styles.divider} />
        </View>

        {winners.map((w, i) => (
          <View key={i} style={styles.winnerRow}>
            <Text style={styles.name}>{w.username}</Text>
            {w.handName && (
              <Text style={styles.handType}>{w.handName.toUpperCase()}</Text>
            )}
            <Text style={styles.amount}>+${w.winAmount.toLocaleString()}</Text>
          </View>
        ))}

        <View style={styles.timerBar}>
          <Text style={styles.timerText}>Next hand in {seconds}s</Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressBar, { width: `${(seconds / 5) * 100}%` }]}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    pointerEvents: "none", // Allows touches to pass through if necessary
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    minWidth: 280,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  headerText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 4,
    opacity: 0.6,
    marginBottom: 5,
  },
  trophyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  winnerTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
    marginHorizontal: 15,
    letterSpacing: 2,
  },
  divider: {
    height: 2,
    width: 30,
    backgroundColor: COLORS.primary,
    opacity: 0.5,
  },
  winnerRow: {
    alignItems: "center",
    marginVertical: SPACING.sm,
  },
  name: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  handType: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 1,
  },
  amount: {
    color: "#4cd137", // Bright poker green
    fontSize: 24,
    fontWeight: "900",
    marginTop: 5,
  },
  timerBar: {
    marginTop: 25,
    width: "100%",
    alignItems: "center",
  },
  timerText: {
    color: "#666",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    width: 120,
    backgroundColor: "#222",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
});
