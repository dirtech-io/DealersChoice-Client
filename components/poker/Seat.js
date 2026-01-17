import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { COLORS, SPACING, SIZING, RADIUS } from "../../styles/theme";
import { playSound } from "../../utils/audioManager";

const { width, height } = Dimensions.get("window");

// NEW: Sub-component for individual card animations
const AnimatedCard = ({ card, index, isHidden }) => {
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = dealer, 1 = seat
  const flipAnim = useRef(new Animated.Value(0)).current; // 0 = back, 1 = front

  useEffect(() => {
    // 1. Slide from center (Dealer position)
    setTimeout(() => playSound("cardSlide"), index * 150);
    Animated.spring(slideAnim, {
      toValue: 1,
      delay: index * 150, // Stagger cards
      useNativeDriver: true,
      tension: 20,
      friction: 7,
    }).start();

    // 2. Flip to show front
    if (!isHidden) {
      setTimeout(() => playSound("cardFlip"), index * 150 + 300);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 150 + 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isHidden]);

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "0deg"],
  });

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height / 3, 0], // Cards slide down from center area
  });

  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.miniCard,
        { transform: [{ translateY }, { rotateY }, { scale }] },
      ]}
    >
      {/* FRONT OF CARD */}
      <Animated.View
        style={[styles.cardFace, styles.cardFront, { opacity: flipAnim }]}
      >
        <Text
          style={[
            styles.miniCardText,
            { color: card.match(/[sh♥♦]/i) ? COLORS.cardSuitRed : "#000" },
          ]}
        >
          {card}
        </Text>
      </Animated.View>

      {/* BACK OF CARD */}
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

export default function Seat({
  index,
  pos,
  player,
  isDealer,
  isActing,
  isWinner,
  onPress,
  myHand,
  currentStreet,
  socket,
}) {
  const moveAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [timeLeft, setTimeLeft] = useState(30);

  // ... (Keep existing Bet Move and Winner Pulse useEffects)
  useEffect(() => {
    if (player?.currentStreetBet > 0) {
      Animated.timing(moveAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        moveAnim.setValue(0);
      });
    }
  }, [currentStreet]);

  useEffect(() => {
    if (isWinner) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 6 },
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isWinner]);

  useEffect(() => {
    if (isActing && socket) {
      socket.on("turnTimerUpdate", (data) => setTimeLeft(data.timeLeft));
    }
    return () => socket?.off("turnTimerUpdate");
  }, [isActing, socket]);

  const translateX = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - (pos.left ? parseFloat(pos.left) : width / 2)],
  });

  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height / 2 - (pos.top ? parseFloat(pos.top) : height / 2)],
  });

  const shouldShowCards =
    myHand ||
    (player?.hand &&
      currentStreet === "SHOWDOWN" &&
      !player.folded &&
      !player.mucked);

  if (!player) {
    return (
      <View style={[styles.seatWrapper, pos]}>
        <TouchableOpacity style={styles.emptyContainer} onPress={onPress}>
          <View style={styles.emptyCircle}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
          <Text style={styles.sitText}>SIT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.seatWrapper, pos]}>
      {/* 1. BET BUBBLE */}
      {player.currentStreetBet > 0 && (
        <Animated.View
          style={[
            styles.betBubble,
            { transform: [{ translateX }, { translateY }] },
          ]}
        >
          <View style={styles.chipGraphic} />
          <Text style={styles.betText}>${player.currentStreetBet}</Text>
        </Animated.View>
      )}

      {/* 2. TIMER BAR */}
      {isActing && (
        <View style={styles.timerBarContainer}>
          <View
            style={[
              styles.timerBarFill,
              { width: `${(timeLeft / 30) * 100}%` },
            ]}
          />
        </View>
      )}

      <TouchableOpacity onPress={onPress} disabled={true} activeOpacity={1}>
        {isDealer && (
          <View style={styles.dealerButton}>
            <Text style={styles.dealerText}>D</Text>
          </View>
        )}
        {isWinner && (
          <View style={styles.winBadge}>
            <Text style={styles.winBadgeText}>WINNER</Text>
          </View>
        )}
        {player.mucked && (
          <View style={styles.muckBadge}>
            <Text style={styles.muckBadgeText}>MUCKED</Text>
          </View>
        )}

        <Animated.View
          style={[
            styles.seatCircle,
            isWinner && styles.winnerGlow,
            isActing && styles.activeTurnGlow,
            (player?.folded || player?.mucked) && styles.foldedPlayer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.avatarText}>
            {player.username?.[0].toUpperCase()}
          </Text>
        </Animated.View>

        <View style={styles.labelContainer}>
          <Text style={styles.usernameText} numberOfLines={1}>
            {player.username}
          </Text>
          <Text style={styles.chipText}>${player.chips}</Text>
        </View>
      </TouchableOpacity>

      {/* 3. ANIMATED CARDS */}
      {shouldShowCards && (
        <View style={styles.handOverlay}>
          {(myHand || player.hand).map((card, i) => (
            <AnimatedCard key={i} card={card} index={i} isHidden={false} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Keep existing styles)
  seatWrapper: {
    position: "absolute",
    width: 80,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -40 }, { translateY: -50 }],
  },
  seatCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  avatarText: { color: COLORS.textMain, fontWeight: "bold", fontSize: 20 },
  labelContainer: {
    backgroundColor: COLORS.overlay,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: -8,
    alignItems: "center",
    minWidth: 70,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  usernameText: { color: COLORS.textMain, fontSize: 10, fontWeight: "bold" },
  chipText: { color: COLORS.primary, fontSize: 11, fontWeight: "900" },
  activeTurnGlow: { borderColor: COLORS.primary, borderWidth: 3, elevation: 8 },
  winnerGlow: { borderColor: "#FFD700", borderWidth: 4, elevation: 15 },
  winBadge: {
    position: "absolute",
    top: -18,
    alignSelf: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 40,
  },
  winBadgeText: { color: "#000", fontSize: 9, fontWeight: "bold" },
  handOverlay: {
    flexDirection: "row",
    position: "absolute",
    bottom: -10,
    zIndex: 50,
  },

  // NEW CARD STYLES
  miniCard: {
    width: 32,
    height: 44,
    marginHorizontal: 2,
    backfaceVisibility: "hidden", // Crucial for flip effect
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  cardFront: { backgroundColor: "#FFF" },
  cardBack: { backgroundColor: COLORS.primaryDark, borderColor: "#fff" },
  cardBackPattern: {
    width: "70%",
    height: "70%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  miniCardText: { fontSize: 12, fontWeight: "bold" },

  // ... (Include your other existing styles)
  betBubble: {
    position: "absolute",
    top: -25,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    zIndex: 30,
  },
  chipGraphic: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginRight: 4,
  },
  betText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  timerBarContainer: {
    position: "absolute",
    top: -15,
    width: 50,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  timerBarFill: { height: "100%", backgroundColor: COLORS.primary },
  dealerButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFF",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#999",
  },
  dealerText: { color: "#000", fontSize: 12, fontWeight: "bold" },
  emptyContainer: { alignItems: "center", justifyContent: "center" },
  emptyCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  plusIcon: { color: COLORS.textSecondary, fontSize: 20, fontWeight: "300" },
  sitText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    fontWeight: "bold",
  },
  foldedPlayer: { opacity: 0.4 },
});
