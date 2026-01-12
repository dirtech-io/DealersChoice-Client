// components/poker/DealerMessage.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function DealerMessage({ message }) {
  if (!message) return <View style={styles.spacer} />;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    marginBottom: SPACING.sm,
  },
  spacer: {
    height: 20, // Maintains layout height when no message is present
    marginBottom: SPACING.sm,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    fontStyle: "italic",
  },
});
