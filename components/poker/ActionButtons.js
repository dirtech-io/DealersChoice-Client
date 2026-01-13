import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";

export default function ActionButtons({ tableData, myPlayer, onAction }) {
  const [showRaiseMenu, setShowRaiseMenu] = useState(false);

  // 1. MATH CONSTANTS
  const currentBet = tableData.currentBet || 0;
  const minRaiseAmount = tableData.minRaiseAmount || 20; // The 'jump' from server
  const myCurrentContribution = myPlayer?.currentStreetBet || 0;
  const playerChips = myPlayer?.chips || 0;

  // Min Raise Total is the current price + the last raise jump
  const minTotalRaise = currentBet + minRaiseAmount;
  // Max is everything the player has (All-In)
  const maxTotalRaise = playerChips + myCurrentContribution;

  const pot = tableData.pot || 0;
  const callAmount = currentBet - myCurrentContribution;
  const isCheck = callAmount <= 0;

  // Local state for the slider
  const [currentRaiseAmount, setCurrentRaiseAmount] = useState(minTotalRaise);

  // Reset slider whenever it's opened or the bet changes
  useEffect(() => {
    setCurrentRaiseAmount(Math.min(minTotalRaise, maxTotalRaise));
  }, [minTotalRaise, maxTotalRaise, showRaiseMenu]);

  const handleRaiseSubmit = () => {
    onAction("raise", currentRaiseAmount);
    setShowRaiseMenu(false);
  };

  const handleQuickBet = (percent) => {
    // Poker math: A "Pot" bet usually means Call + the Pot after the call
    // Simplified: (Pot * percent) + currentBet
    let amount = Math.floor(pot * percent) + currentBet;

    // Clamp between Min Raise and All-In
    amount = Math.max(amount, minTotalRaise);
    amount = Math.min(amount, maxTotalRaise);
    setCurrentRaiseAmount(amount);
  };

  const handleTimeBank = () => {
    socket.emit("useTimeBank", { tableId: tableData.id });
  };

  const hasTimeBank = myPlayer?.timeBank > 0;

  return (
    <View style={styles.actionContainer}>
      {showRaiseMenu ? (
        /* --- RAISE MENU (SLIDER & QUICK BETS) --- */
        <View style={styles.raiseMenu}>
          <Text style={styles.raiseAmountText}>
            RAISE TO: ${currentRaiseAmount}
          </Text>

          <Slider
            style={{ width: "100%", height: 50 }}
            minimumValue={minTotalRaise}
            maximumValue={maxTotalRaise}
            step={10}
            value={currentRaiseAmount}
            onValueChange={(val) => setCurrentRaiseAmount(Math.floor(val))}
            minimumTrackTintColor={COLORS.raise}
            maximumTrackTintColor="#333"
            thumbTintColor={COLORS.raise}
          />

          <View style={styles.quickBetRow}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickBet(0.33)}
            >
              <Text style={styles.quickBtnText}>1/3</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickBet(0.5)}
            >
              <Text style={styles.quickBtnText}>1/2</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickBet(0.75)}
            >
              <Text style={styles.quickBtnText}>3/4</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => handleQuickBet(1)}
            >
              <Text style={styles.quickBtnText}>POT</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.confirmRaiseRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setShowRaiseMenu(false)}
            >
              <Text style={styles.backBtnText}>BACK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmRaiseBtn}
              onPress={handleRaiseSubmit}
            >
              <Text style={styles.btnText}>CONFIRM ${currentRaiseAmount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* --- STANDARD ACTION BUTTONS --- */
        <View style={styles.buttonRow}>
          {tableData.actingIndex === myPlayer?.seatIndex && hasTimeBank && (
            <TouchableOpacity
              style={styles.timeBankBtn}
              onPress={handleTimeBank}
            >
              <Text style={styles.timeBtnText}>
                TIME ({myPlayer.timeBank}s)
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.foldBtn]}
            onPress={() => onAction("fold")}
          >
            <Text style={styles.btnText}>FOLD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={() => onAction("call")}
          >
            <Text style={styles.btnText}>
              {isCheck ? "CHECK" : `CALL $${callAmount}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.raiseBtn]}
            onPress={() => setShowRaiseMenu(true)}
            disabled={playerChips === 0}
          >
            <Text style={styles.btnText}>
              {tableData.currentBet === 0 ? "BET" : "RAISE"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
  foldBtn: { backgroundColor: COLORS.fold || "#d9534f" },
  callBtn: { backgroundColor: COLORS.call || "#5bc0de" },
  raiseBtn: { backgroundColor: COLORS.raise || "#5cb85c" },
  btnText: {
    color: COLORS.textMain,
    fontWeight: "900",
    fontSize: 14,
    textTransform: "uppercase",
  },
  raiseMenu: {
    backgroundColor: "rgba(0,0,0,0.9)",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: SPACING.sm,
  },
  raiseAmountText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  quickBetRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: SPACING.md,
  },
  quickBtn: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: RADIUS.md,
    minWidth: 80,
    alignItems: "center",
  },
  quickBtnText: {
    color: COLORS.textMain,
    fontWeight: "bold",
    fontSize: 12,
  },
  confirmRaiseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: SPACING.md,
  },
  backBtnText: {
    color: "#aaa",
    fontWeight: "bold",
  },
  confirmRaiseBtn: {
    flex: 1,
    backgroundColor: COLORS.raise || "#5cb85c",
    height: 50,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    marginLeft: SPACING.sm,
  },
  quickBtn: {
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    flex: 1, // Spread them evenly
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    // Standard "poker app" shadow
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  quickBtnText: {
    color: COLORS.primary || "#FFD700", // Gold or your primary brand color
    fontWeight: "800",
    fontSize: 12,
  },
  timeBankBtn: {
    backgroundColor: "#4a90e2", // Blue to distinguish from game actions
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#fff",
  },
  timeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});
