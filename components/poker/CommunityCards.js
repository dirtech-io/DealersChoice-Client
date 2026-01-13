import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";

export default function CommunityCards({ cards, pot, activeGame }) {
  // 1. ANIMATION SETUP
  // Scale value for the pot "pulse" effect
  const potScale = useRef(new Animated.Value(1)).current;
  const slots = [0, 1, 2, 3, 4];

  // 2. TRIGGER PULSE ON POT CHANGE
  useEffect(() => {
    if (pot > 0) {
      Animated.sequence([
        Animated.timing(potScale, {
          toValue: 1.15, // Scale up
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(potScale, {
          toValue: 1, // Snap back
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pot]);

  return (
    <View style={styles.communityArea}>
      {/* POT DISPLAY - Now wrapped in Animated.View */}
      <Animated.View
        style={[styles.potContainer, { transform: [{ scale: potScale }] }]}
      >
        <Text style={styles.potLabel}>POT</Text>
        <Text style={styles.potValue}>${pot || 0}</Text>
      </Animated.View>

      {/* CARDS ROW */}
      <View style={styles.cardsRow}>
        {slots.map((i) => {
          const card = cards[i];
          // Check for Hearts (H) or Diamonds (D)
          const isRed = card?.match(/[HD]/);

          return (
            <View
              key={i}
              style={[
                styles.cardSlot,
                card ? styles.cardActive : styles.cardEmpty,
              ]}
            >
              {card ? (
                <Text
                  style={[
                    styles.cardText,
                    { color: isRed ? "#ff4d4d" : "#000" }, // Changed text to black for better contrast on white cards
                  ]}
                >
                  {card}
                </Text>
              ) : (
                <View style={styles.cardPlaceholder} />
              )}
            </View>
          );
        })}
      </View>

      {/* GAME INFO */}
      <Text style={styles.gameInfoText}>{activeGame || "DEALER'S CHOICE"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  communityArea: {
    ...globalStyles.centered,
    width: "100%",
  },
  potContainer: {
    backgroundColor: "rgba(0,0,0,0.8)", // Darker for better contrast during pulse
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary, // Solid gold border
    elevation: 10, // Shadow for depth
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  potLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "bold",
    marginRight: 5,
    textTransform: "uppercase",
  },
  potValue: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 18, // Slightly larger
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cardSlot: {
    width: 42, // Slightly wider for better readability
    height: 58,
    marginHorizontal: 4,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cardActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  cardEmpty: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
  },
  cardText: {
    fontSize: 16, // Larger text
    fontWeight: "900",
  },
  cardPlaceholder: {
    width: "40%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  gameInfoText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: SPACING.md,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
