import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function Seat({
  index,
  pos,
  player,
  isDealer,
  isActing,
  onPress,
  myHand,
}) {
  const shouldShowCards = () => {
    if (myHand) return true; // Always show my own cards
    if (
      tableData.currentStreet === "SHOWDOWN" &&
      player?.hand &&
      !player.folded
    ) {
      return true; // Show others' cards only at showdown if they didn't fold
    }
    return false;
  };
  return (
    <TouchableOpacity
      style={[styles.seatWrapper, pos]}
      onPress={onPress}
      disabled={!!player} // Disable clicking if someone is already sitting here
    >
      {/* DEALER BUTTON */}
      {isDealer && (
        <View style={styles.dealerButton}>
          <Text style={styles.dealerText}>D</Text>
        </View>
      )}

      {/* PLAYER AVATAR / SEAT CIRCLE */}
      <View
        style={[
          styles.seatCircle,
          player && styles.occupiedSeat,
          isActing && styles.activeTurnGlow,
        ]}
      >
        {player ? (
          <Text style={styles.avatarText}>
            {player.username?.[0].toUpperCase()}
          </Text>
        ) : (
          <Text style={styles.plusIcon}>+</Text>
        )}
      </View>

      {/* PLAYER INFO CARD (Name & Chips) */}
      <View style={styles.labelContainer}>
        <Text style={styles.usernameText} numberOfLines={1}>
          {player ? player.username : "EMPTY"}
        </Text>
        {player && <Text style={styles.chipText}>${player.chips}</Text>}
      </View>

      {/* PRIVATE HAND / SHOWDOWN HAND */}
      {(myHand || (player?.hand && tableData.currentStreet === "SHOWDOWN")) && (
        <View style={styles.handOverlay}>
          {(myHand || player.hand).map((card, i) => (
            <View key={i} style={styles.miniCard}>
              <Text
                style={[
                  styles.miniCardText,
                  { color: card.match(/[HD]/) ? "#ff4d4d" : "#fff" },
                ]}
              >
                {card}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  seatWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 100,
  },
  seatCircle: {
    width: 50,
    height: 50,
    borderRadius: 25, // Perfectly round for the avatar
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 2,
    borderColor: COLORS.fold, // Using a neutral dark grey for empty seats
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  occupiedSeat: {
    backgroundColor: "#1a1a1a",
    borderColor: COLORS.primaryDark,
  },
  activeTurnGlow: {
    borderColor: COLORS.primary, // Gold border for active turn
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
  },
  avatarText: {
    color: COLORS.textMain,
    fontWeight: "bold",
    fontSize: 20,
  },
  plusIcon: {
    color: COLORS.textSecondary,
    fontSize: 24,
  },
  labelContainer: {
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginTop: 5,
    alignItems: "center",
    minWidth: 70,
  },
  usernameText: {
    color: COLORS.textMain,
    fontSize: 10,
    fontWeight: "bold",
  },
  chipText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  dealerButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.cardWhite,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dealerText: {
    color: COLORS.cardSuitBlack,
    fontSize: 12,
    fontWeight: "bold",
  },
  handOverlay: {
    flexDirection: "row",
    position: "absolute",
    bottom: -20,
    zIndex: 10,
  },
  miniCard: {
    width: 25,
    height: 35,
    backgroundColor: COLORS.cardWhite, // Changed from #222 to White for visibility
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  miniCardText: {
    fontSize: 10,
    fontWeight: "bold",
    // Color will be set dynamically (Red/Black) in the component logic
  },
});
