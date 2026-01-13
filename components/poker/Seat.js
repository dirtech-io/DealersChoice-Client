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

const { width, height } = Dimensions.get("window");

export default function Seat({
  index,
  pos,
  player,
  isDealer,
  isActing,
  isWinner, // Added missing prop
  onPress,
  myHand,
  currentStreet,
  socket,
}) {
  const moveAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [timeLeft, setTimeLeft] = useState(30);

  // --- ANIMATION: CHIPS TO CENTER ---
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

  // --- ANIMATION: WINNER PULSE ---
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
        { iterations: 6 }
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isWinner]);

  // --- TIMER SYNC ---
  useEffect(() => {
    if (isActing && socket) {
      socket.on("turnTimerUpdate", (data) => setTimeLeft(data.timeLeft));
    }
    return () => socket?.off("turnTimerUpdate");
  }, [isActing, socket]);

  // Interpolations for chip movement
  const translateX = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - (pos.left ? parseFloat(pos.left) : width / 2)],
  });

  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height / 2 - (pos.top ? parseFloat(pos.top) : height / 2)],
  });

  const shouldShowCards =
    myHand || (player?.hand && currentStreet === "SHOWDOWN" && !player.folded);

  // --- RENDER: EMPTY SEAT ---
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

  // --- RENDER: OCCUPIED SEAT ---
  return (
    <View style={[styles.seatWrapper, pos]}>
      {/* 1. BET BUBBLE (Animated) */}
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
        {/* DEALER BUTTON */}
        {isDealer && (
          <View style={styles.dealerButton}>
            <Text style={styles.dealerText}>D</Text>
          </View>
        )}

        {/* WINNER BADGE */}
        {isWinner && (
          <View style={styles.winBadge}>
            <Text style={styles.winBadgeText}>WINNER</Text>
          </View>
        )}

        {/* AVATAR CIRCLE (With Pulse Animation) */}
        <Animated.View
          style={[
            styles.seatCircle,
            isWinner && styles.winnerGlow,
            isActing && styles.activeTurnGlow,
            player?.folded && styles.foldedPlayer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.avatarText}>
            {player.username?.[0].toUpperCase()}
          </Text>
        </Animated.View>

        {/* PLAYER INFO CARD */}
        <View style={styles.labelContainer}>
          <Text style={styles.usernameText} numberOfLines={1}>
            {player.username}
          </Text>
          <Text style={styles.chipText}>${player.chips}</Text>

          {player?.timeBank > 0 && (
            <View style={styles.timeBankIndicator}>
              <Text style={styles.timeBankLetter}>T</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* CARDS */}
      {shouldShowCards && (
        <View style={styles.handOverlay}>
          {(myHand || player.hand).map((card, i) => (
            <View key={i} style={styles.miniCard}>
              <Text
                style={[
                  styles.miniCardText,
                  { color: card.match(/[HD]/) ? COLORS.cardSuitRed : "#000" },
                ]}
              >
                {card}
              </Text>
            </View>
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
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
  plusIcon: {
    color: COLORS.textSecondary,
    fontSize: 20,
    fontWeight: "300",
  },
  sitText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    fontWeight: "bold",
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
  activeTurnGlow: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  winnerGlow: {
    borderColor: "#FFD700",
    borderWidth: 4,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
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
  winBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "bold",
  },
  avatarText: {
    color: COLORS.textMain,
    fontWeight: "bold",
    fontSize: 20,
  },
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
  usernameText: {
    color: COLORS.textMain,
    fontSize: 10,
    fontWeight: "bold",
  },
  chipText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
  },
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
  handOverlay: {
    flexDirection: "row",
    position: "absolute",
    bottom: -10,
    zIndex: 20,
  },
  miniCard: {
    width: 28,
    height: 40,
    backgroundColor: "#FFF",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 1,
    elevation: 4,
  },
  miniCardText: { fontSize: 12, fontWeight: "bold" },
  foldedPlayer: { opacity: 0.4 },
  timeBankIndicator: {
    position: "absolute",
    right: -10,
    top: -5,
    backgroundColor: COLORS.call,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  timeBankLetter: { color: "#fff", fontSize: 9, fontWeight: "bold" },
});
