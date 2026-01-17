import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";
import { playSound } from "../../utils/audioManager";

// NEW: Sub-component for individual community card animations
const AnimatedCommunityCard = ({ card, index }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Slide from the right (deck position)
    Animated.spring(slideAnim, {
      toValue: 1,
      delay: index * 100, // Staggered entry
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // 2. Flip to reveal face
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100 + 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "0deg"],
  });

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0], // Slides in from the right side of the screen
  });

  const isRed = card?.match(/[HD♥♦]/);

  return (
    <Animated.View
      style={[
        styles.cardSlot,
        styles.cardActive,
        { transform: [{ translateX }, { rotateY }] },
      ]}
    >
      {/* FRONT FACE */}
      <Animated.View
        style={[styles.cardFace, styles.cardFront, { opacity: flipAnim }]}
      >
        <Text style={[styles.cardText, { color: isRed ? "#ff4d4d" : "#000" }]}>
          {card}
        </Text>
      </Animated.View>

      {/* BACK FACE */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          {
            opacity: flipAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <View style={styles.cardBackPattern} />
      </Animated.View>
    </Animated.View>
  );
};

export default function CommunityCards({ cards, pot, activeGame }) {
  const potScale = useRef(new Animated.Value(1)).current;
  const slots = [0, 1, 2, 3, 4];

  useEffect(() => {
    if (pot > 0) {
      playSound("chips"); // Trigger sound
      Animated.sequence([
        Animated.timing(potScale, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(potScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pot]);

  return (
    <View style={styles.communityArea}>
      <Animated.View
        style={[styles.potContainer, { transform: [{ scale: potScale }] }]}
      >
        <Text style={styles.potLabel}>POT</Text>
        <Text style={styles.potValue}>${pot || 0}</Text>
      </Animated.View>

      <View style={styles.cardsRow}>
        {slots.map((i) => (
          <View key={i}>
            {cards[i] ? (
              <AnimatedCommunityCard card={cards[i]} index={i} />
            ) : (
              <View style={[styles.cardSlot, styles.cardEmpty]}>
                <View style={styles.cardPlaceholder} />
              </View>
            )}
          </View>
        ))}
      </View>

      <Text style={styles.gameInfoText}>{activeGame || "DEALER'S CHOICE"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  communityArea: { ...globalStyles.centered, width: "100%" },
  potContainer: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  potLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "bold",
    marginRight: 5,
  },
  potValue: { color: COLORS.primary, fontWeight: "900", fontSize: 18 },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cardSlot: {
    width: 42,
    height: 58,
    marginHorizontal: 4,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  cardFront: { backgroundColor: "#FFFFFF" },
  cardBack: {
    backgroundColor: COLORS.primaryDark,
    borderWidth: 1,
    borderColor: "#fff",
  },
  cardBackPattern: {
    width: "70%",
    height: "70%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  cardActive: {
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  cardEmpty: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    borderWidth: 1,
  },
  cardText: { fontSize: 16, fontWeight: "900" },
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
  },
});
