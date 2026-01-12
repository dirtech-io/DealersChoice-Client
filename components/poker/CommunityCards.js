import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";

export default function CommunityCards({ cards, pot, activeGame }) {
  // We want to ensure 5 slots are always visible to maintain table layout
  const slots = [0, 1, 2, 3, 4];

  return (
    <View style={styles.communityArea}>
      {/* POT DISPLAY */}
      <View style={styles.potContainer}>
        <Text style={styles.potLabel}>POT</Text>
        <Text style={styles.potValue}>${pot || 0}</Text>
      </View>

      {/* CARDS ROW */}
      <View style={styles.cardsRow}>
        {slots.map((i) => {
          const card = cards[i];
          const isRed = card?.match(/[HD]/); // Hearts or Diamonds

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
                    { color: isRed ? "#ff4d4d" : "#fff" },
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
    backgroundColor: "rgba(0,0,0,0.6)", // Slight transparency to see the felt
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round, // Makes it a pill shape
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.primary}44`, // Adding 44 for hex transparency (approx 25%)
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
    fontSize: 16,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cardSlot: {
    width: 38,
    height: 54,
    marginHorizontal: 3,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cardActive: {
    backgroundColor: COLORS.cardWhite,
    borderColor: "#ddd",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  cardEmpty: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: "rgba(255,255,255,0.05)",
    borderStyle: "dashed",
  },
  cardText: {
    fontSize: 14,
    fontWeight: "900",
    // Color (Red/Black) is handled by inline logic in the component
  },
  cardPlaceholder: {
    width: "60%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  gameInfoText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    fontWeight: "bold",
    marginTop: SPACING.md,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
