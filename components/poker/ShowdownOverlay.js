import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function ShowdownOverlay({ winners }) {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!winners || winners.length === 0) return null;

  return (
    <View style={styles.overlay}>
      <Text style={styles.winnerText}>SHOWDOWN</Text>
      <Text style={styles.winnerText}>WINNER</Text>
      {winners.map((w, i) => (
        <View key={i} style={styles.winnerRow}>
          <Text style={styles.name}>{w.username}</Text>
          <Text style={styles.amount}>+${w.winAmount}</Text>
        </View>
      ))}
      <View style={styles.timerBar}>
        <Text style={styles.timerText}>Next hand in {seconds}s...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: "40%",
    backgroundColor: COLORS.overlay, // Using standardized 0.85 opacity
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary, // Bright gold for the winner announcement
    alignItems: "center",
    zIndex: 100,
    minWidth: 220,
    // Add a slight shadow to make it pop off the felt
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  winnerText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  winnerRow: {
    alignItems: "center",
    marginTop: SPACING.md,
  },
  name: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: "900",
  },
  // New style for the specific hand (e.g., "Flush")
  handType: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 5,
  },
  amount: {
    color: COLORS.raise, // Using the 'Raise' green for positive money flow
    fontSize: 20,
    fontWeight: "bold",
  },
  timerBar: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: SPACING.sm,
    width: "100%",
    alignItems: "center",
  },
  timerText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
});
