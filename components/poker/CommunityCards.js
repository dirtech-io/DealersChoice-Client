import React, { useEffect, useRef, memo } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";
import { playSound } from "../../utils/audioManager";

const AnimatedCommunityCard = memo(({ card, index }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Slide from deck (top-right entrance)
    Animated.spring(slideAnim, {
      toValue: 1,
      delay: index * 120, // Slightly slower stagger for better visual tracking
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // 2. Flip to reveal face after slide completes
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 120 + 200,
      useNativeDriver: true,
    }).start(() => {
      // Play flip sound exactly when the card turns over
      playSound("cardFlip");
    });
  }, []);

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "0deg"],
  });

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0], // Longer slide distance for "flown-in" effect
  });

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  // Color logic for 4-color deck or standard red/black
  const getSuitColor = (c) => {
    if (!c) return "#000";
    const suit = c.slice(-1).toLowerCase();
    // Support for both 'h/d' chars and actual symbols
    if (suit === "h" || c.includes("♥")) return "#E74C3C"; // Heart Red
    if (suit === "d" || c.includes("♦")) return "#3498DB"; // Diamond Blue (Pro 4-color style)
    if (suit === "c" || c.includes("♣")) return "#27AE60"; // Club Green
    return "#2C3E50"; // Spade Black
  };

  return (
    <Animated.View
      style={[
        styles.cardSlot,
        styles.cardActive,
        { transform: [{ translateX }, { translateY }, { rotateY }] },
      ]}
    >
      {/* FRONT FACE (Visible after flip) */}
      <Animated.View
        style={[styles.cardFace, styles.cardFront, { opacity: flipAnim }]}
      >
        <Text style={[styles.cardText, { color: getSuitColor(card) }]}>
          {card}
        </Text>
      </Animated.View>

      {/* BACK FACE (Visible during slide) */}
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
        <View style={styles.cardBackPattern}>
          <Text style={styles.backLogo}>♣</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
});

export default function CommunityCards({ cards = [], pot, activeGame }) {
  const potScale = useRef(new Animated.Value(1)).current;
  const slots = [0, 1, 2, 3, 4];

  useEffect(() => {
    if (pot > 0) {
      playSound("chips");
      // Interaction feedback for pot growth
      Animated.sequence([
        Animated.timing(potScale, {
          toValue: 1.15,
          duration: 100,
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
      {/* IMPROVED POT BADGE */}
      <Animated.View
        style={[styles.potContainer, { transform: [{ scale: potScale }] }]}
      >
        <View style={styles.potInner}>
          <Text style={styles.potLabel}>TOTAL POT</Text>
          <Text style={styles.potValue}>${(pot || 0).toLocaleString()}</Text>
        </View>
      </Animated.View>

      <View style={styles.cardsRow}>
        {slots.map((i) => (
          <View key={i}>
            {cards && cards[i] ? (
              <AnimatedCommunityCard card={cards[i]} index={i} />
            ) : (
              <View style={[styles.cardSlot, styles.cardEmpty]}>
                <View style={styles.cardPlaceholder} />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* GAME STATUS INFO */}
      <View style={styles.gameInfoBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.gameInfoText}>{activeGame || "NL HOLD'EM"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  communityArea: {
    ...globalStyles.centered,
    width: "100%",
    paddingVertical: 10,
  },
  potContainer: {
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: RADIUS.xl,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  potInner: {
    alignItems: "center",
  },
  potLabel: {
    color: "#AAA",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
  },
  potValue: {
    color: "#FFF", // Changed to White for better readability against gold border
    fontWeight: "900",
    fontSize: 22,
    fontFamily: "System",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 75,
  },
  cardSlot: {
    width: 48,
    height: 68,
    marginHorizontal: 3,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cardFront: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD",
    elevation: 5,
  },
  cardBack: {
    backgroundColor: "#1A1A1A", // Dark theme card backs
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  cardBackPattern: {
    width: "85%",
    height: "85%",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)", // Subtle gold pattern
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  backLogo: {
    color: COLORS.primary,
    fontSize: 14,
    opacity: 0.4,
  },
  cardActive: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 5 },
  },
  cardEmpty: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  cardText: {
    fontSize: 20,
    fontWeight: "900",
  },
  cardPlaceholder: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  gameInfoBadge: {
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4cd137",
    marginRight: 8,
  },
  gameInfoText: {
    color: "#888",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
