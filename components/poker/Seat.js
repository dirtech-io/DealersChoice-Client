import React, { useEffect, useRef, useState, memo, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { playSound } from "../../utils/audioManager";
import { getHandDescription } from "../../utils/handEvaluator";

const { width, height } = Dimensions.get("window");

// Sub-component for individual card animations
const AnimatedCard = memo(
  ({ card, index, isHidden, totalCards, isSelected, isDiscardMode }) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;
    const selectAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // 1. Slide from center (Deck position)
      setTimeout(() => playSound("cardSlide"), index * 80);
      Animated.spring(slideAnim, {
        toValue: 1,
        delay: index * 80,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();

      // 2. Flip
      if (!isHidden) {
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 80 + 200,
          useNativeDriver: true,
        }).start(() => playSound("cardFlip"));
      }
    }, [isHidden]);

    // 3. Selection "Pop" animation for discard modes
    useEffect(() => {
      Animated.spring(selectAnim, {
        toValue: isSelected ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }, [isSelected]);

    const rotateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["180deg", "0deg"],
    });

    const translateYBase = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-height / 4, 0],
    });

    const selectTranslateY = selectAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -15],
    });

    // Dynamic rotation to "fan" cards based on how many the player has
    const cardRotation =
      totalCards > 1 ? `${(index - (totalCards - 1) / 2) * 6}deg` : "0deg";

    const getSuitColor = (c) => {
      if (!c) return "#1A1A1A";
      const suit = c.slice(-1).toLowerCase();
      if (suit === "h" || c.includes("♥")) return "#E74C3C"; // Red Hearts
      if (suit === "d" || c.includes("♦")) return "#3498DB"; // Blue Diamonds
      if (suit === "c" || c.includes("♣")) return "#27AE60"; // Green Clubs
      return "#2C3E50"; // Black Spades
    };

    return (
      <Animated.View
        style={[
          styles.miniCard,
          {
            transform: [
              { translateY: translateYBase },
              { translateY: selectTranslateY },
              { rotateY },
              { rotateZ: cardRotation },
            ],
            // Tighten overlap if player has many cards (PLO5/Draw)
            marginLeft: index === 0 ? 0 : totalCards > 3 ? -22 : -15,
            opacity:
              isDiscardMode && !isSelected && isSelected !== undefined
                ? 0.6
                : 1,
          },
        ]}
      >
        <Animated.View
          style={[styles.cardFace, styles.cardFront, { opacity: flipAnim }]}
        >
          <Text style={[styles.miniCardText, { color: getSuitColor(card) }]}>
            {card}
          </Text>
        </Animated.View>

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
  },
);

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
  activeGame,
  isDiscarding,
  selectedCards,
  onToggleCardSelection,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [timeLeft, setTimeLeft] = useState(30);

  const handStrength = useMemo(() => {
    if (!myHand || myHand.length === 0 || player?.folded) return null;
    return getHandDescription(activeGame || "NLH", myHand, []);
  }, [myHand, player?.folded, activeGame]);

  useEffect(() => {
    if (isWinner) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
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

  // Listen for global turn timer updates via socket
  useEffect(() => {
    if (isActing && socket) {
      const handleTimer = (data) => {
        if (data.seatIndex === index) setTimeLeft(data.timeLeft);
      };
      socket.on("turnTimerUpdate", handleTimer);
      return () => socket.off("turnTimerUpdate", handleTimer);
    }
  }, [isActing, socket, index]);

  if (!player) {
    return (
      <View style={[styles.seatWrapper, { top: pos.top, left: pos.left }]}>
        <TouchableOpacity style={styles.emptyContainer} onPress={onPress}>
          <View style={styles.emptyCircle}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
          <Text style={styles.sitText}>SIT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAllIn =
    player.chips === 0 && !player.folded && player.currentStreetBet > 0;
  const cardsToRender =
    myHand || (currentStreet === "SHOWDOWN" ? player.hand : null);

  return (
    <View style={[styles.seatWrapper, { top: pos.top, left: pos.left }]}>
      {/* BET BUBBLE */}
      {player.currentStreetBet > 0 && (
        <View style={styles.betBubble}>
          <View style={styles.chipGraphic} />
          <Text style={styles.betText}>
            ${player.currentStreetBet.toLocaleString()}
          </Text>
        </View>
      )}

      {/* TURN TIMER BAR */}
      {isActing && (
        <View style={styles.timerBarContainer}>
          <View
            style={[
              styles.timerBarFill,
              {
                width: `${(timeLeft / 30) * 100}%`,
                backgroundColor: timeLeft < 8 ? "#ff4757" : COLORS.primary,
              },
            ]}
          />
        </View>
      )}

      {/* HAND STRENGTH */}
      {handStrength && !player.folded && (
        <View style={styles.strengthBadge}>
          <Text style={styles.strengthText}>{handStrength}</Text>
        </View>
      )}

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
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

        <View
          style={[
            styles.seatCircle,
            isWinner && styles.winnerGlow,
            isActing &&
              (timeLeft < 8 ? styles.timerDangerGlow : styles.activeTurnGlow),
            player.folded && styles.foldedPlayer,
          ]}
        >
          <Text style={styles.avatarText}>
            {player.username?.[0].toUpperCase()}
          </Text>
        </View>

        <View style={styles.labelContainer}>
          <Text style={styles.usernameText} numberOfLines={1}>
            {player.username}
          </Text>
          <Text style={styles.chipText}>
            {isAllIn ? "ALL-IN" : `$${player.chips.toLocaleString()}`}
          </Text>
        </View>
      </Animated.View>

      {/* PLAYER CARDS */}
      {cardsToRender && (
        <View style={styles.handOverlay}>
          {cardsToRender.map((card, i) => (
            <TouchableOpacity
              key={i}
              disabled={!isDiscarding}
              onPress={() => onToggleCardSelection(i)}
              activeOpacity={1}
            >
              <AnimatedCard
                card={card}
                index={i}
                isHidden={false}
                totalCards={cardsToRender.length}
                isSelected={selectedCards?.includes(i)}
                isDiscardMode={isDiscarding}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  seatWrapper: {
    position: "absolute",
    width: 80,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -40 }, { translateY: -50 }],
  },
  seatCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontWeight: "bold", fontSize: 20 },
  labelContainer: {
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: -10,
    alignItems: "center",
    minWidth: 70,
    borderWidth: 1,
    borderColor: "#333",
  },
  usernameText: { color: "#AAA", fontSize: 9, fontWeight: "600" },
  chipText: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  activeTurnGlow: { borderColor: COLORS.primary, borderWidth: 3 },
  timerDangerGlow: { borderColor: "#ff4757", borderWidth: 3 },
  winnerGlow: { borderColor: "#f1c40f", borderWidth: 3 },
  strengthBadge: {
    position: "absolute",
    top: -25,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 100,
  },
  strengthText: { color: "#000", fontSize: 8, fontWeight: "900" },
  winBadge: {
    position: "absolute",
    top: -15,
    zIndex: 10,
    backgroundColor: "#f1c40f",
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  winBadgeText: { color: "#000", fontSize: 8, fontWeight: "900" },
  handOverlay: {
    flexDirection: "row",
    position: "absolute",
    bottom: -15,
    zIndex: 50,
  },
  miniCard: {
    width: 34,
    height: 48,
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 3,
    borderWidth: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  cardFront: { backgroundColor: "#FFF", borderColor: "#DDD" },
  cardBack: {
    backgroundColor: "#1A1A1A",
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  miniCardText: { fontSize: 14, fontWeight: "900" },
  betBubble: {
    position: "absolute",
    top: -50,
    backgroundColor: "rgba(0,0,0,0.9)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  chipGraphic: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 4,
  },
  betText: { color: COLORS.primary, fontSize: 10, fontWeight: "bold" },
  timerBarContainer: {
    position: "absolute",
    top: -10,
    width: 40,
    height: 3,
    backgroundColor: "#222",
  },
  timerBarFill: { height: "100%" },
  dealerButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FFF",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    borderWidth: 1,
  },
  dealerText: { color: "#000", fontSize: 10, fontWeight: "900" },
  emptyContainer: { alignItems: "center" },
  emptyCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  plusIcon: { color: "#333", fontSize: 20 },
  sitText: { color: "#333", fontSize: 9, marginTop: 4 },
  foldedPlayer: { opacity: 0.4 },
});
