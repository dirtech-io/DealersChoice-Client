import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";

export default function ActionButtons({ tableData, myPlayer, onAction }) {
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);
  const [currentRaiseAmount, setCurrentRaiseAmount] = useState(0);

  // Constants for poker logic
  const minRaise = tableData.currentBet * 2 || 20;
  const pot = tableData.pot || 0;
  const currentBet = tableData.currentBet || 0;
  const myCurrentContribution = myPlayer?.currentStreetBet || 0;
  const callAmount = currentBet - myCurrentContribution;
  const isMyTurn = tableData.actingIndex === myPlayer?.seatIndex;

  //Return nothing or change to disabled buttons
  if (!isMyTurn) return null;

  const handleRaiseSubmit = () => {
    onAction("raise", currentRaiseAmount);
    setShowRaiseSlider(false);
  };

  const handleQuickBet = (multiplier) => {
    const amount = Math.floor(pot * multiplier);
    // Ensure we don't bet less than the minimum raise
    setCurrentRaiseAmount(Math.max(amount, minRaise));
  };

  return (
    <View style={styles.actionContainer}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.foldBtn]}
          onPress={() => socket.emit("fold", { tableId })}
        >
          <Text style={styles.btnText}>FOLD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.callBtn]}
          onPress={() => socket.emit("call", { tableId })}
        >
          <Text style={styles.btnText}>
            {isCheck
              ? "CHECK"
              : `CALL ${callAmount > 0 ? `$${callAmount}` : ""}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.raiseBtn]}
          onPress={() => setShowRaiseMenu(true)}
        >
          <Text style={styles.btnText}>RAISE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    paddingHorizontal: SPACING.md,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    height: 55,
    marginHorizontal: 5,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  foldBtn: { backgroundColor: COLORS.fold },
  callBtn: { backgroundColor: COLORS.call },
  raiseBtn: { backgroundColor: COLORS.raise },
  btnText: {
    color: COLORS.textMain,
    fontWeight: "900",
    fontSize: 14,
    textTransform: "uppercase",
  },

  // Raise Menu
  raiseMenu: {
    backgroundColor: COLORS.overlay,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: SPACING.sm, // Space between menu and main buttons
  },
  quickBetRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: SPACING.md,
  },
  quickBtn: {
    backgroundColor: "#333", // Secondary background
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: RADIUS.md,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  quickBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  confirmRaiseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: SPACING.md,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontWeight: "bold",
  },
  confirmRaiseBtn: {
    flex: 1,
    backgroundColor: COLORS.raise,
    height: 50,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    marginLeft: SPACING.sm,
  },
});
