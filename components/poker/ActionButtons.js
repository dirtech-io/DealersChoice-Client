import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";

export default function ActionButtons({
  tableData,
  myPlayer,
  onAction,
  socket,
}) {
  const [showRaiseMenu, setShowRaiseMenu] = useState(false);

  // 1. HELPERS & CONSTANTS
  const isMyTurn = tableData.actingIndex === myPlayer?.seatIndex;
  const isShowdown = tableData.currentStreet === "SHOWDOWN";

  // Muck Logic Helpers
  const isUserInHand = myPlayer && !myPlayer.folded;
  const isWinner = tableData.lastWinners?.some(
    (w) => w.seatIndex === myPlayer?.seatIndex
  );

  const currentBet = tableData.currentBet || 0;
  const minRaiseAmount = tableData.minRaiseAmount || 20;
  const myCurrentContribution = myPlayer?.currentStreetBet || 0;
  const playerChips = myPlayer?.chips || 0;

  const minTotalRaise = currentBet + minRaiseAmount;
  const maxTotalRaise = playerChips + myCurrentContribution;

  const pot = tableData.pot || 0;
  const callAmount = currentBet - myCurrentContribution;
  const isCheck = callAmount <= 0;

  const [currentRaiseAmount, setCurrentRaiseAmount] = useState(minTotalRaise);

  useEffect(() => {
    setCurrentRaiseAmount(Math.min(minTotalRaise, maxTotalRaise));
  }, [minTotalRaise, maxTotalRaise, showRaiseMenu]);

  const handleRaiseSubmit = () => {
    onAction("raise", currentRaiseAmount);
    setShowRaiseMenu(false);
  };

  const handleQuickBet = (percent) => {
    let amount = Math.floor(pot * percent) + currentBet;
    amount = Math.max(amount, minTotalRaise);
    amount = Math.min(amount, maxTotalRaise);
    setCurrentRaiseAmount(amount);
  };

  const handleTimeBank = () => {
    socket?.emit("useTimeBank", { tableId: tableData.id });
  };

  const handleMuck = () => {
    socket?.emit("muckCards", { tableId: tableData.id });
  };

  // --- RENDER LOGIC ---

  // 1. If it's SHOWDOWN, show the Muck Button if they haven't mucked yet
  if (isShowdown) {
    return (
      <View style={styles.actionContainer}>
        {isUserInHand && !isWinner && !myPlayer.mucked && (
          <TouchableOpacity style={styles.muckBtnFull} onPress={handleMuck}>
            <Text style={styles.btnText}>MUCK CARDS</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 2. If it's not the user's turn, show nothing (or spectator mode)
  if (!isMyTurn) return null;

  return (
    <View style={styles.actionContainer}>
      {showRaiseMenu ? (
        /* --- RAISE MENU --- */
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
            {["1/3", "1/2", "3/4", "POT"].map((label, idx) => {
              const vals = [0.33, 0.5, 0.75, 1];
              return (
                <TouchableOpacity
                  key={label}
                  style={styles.quickBtn}
                  onPress={() => handleQuickBet(vals[idx])}
                >
                  <Text style={styles.quickBtnText}>{label}</Text>
                </TouchableOpacity>
              );
            })}
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
        /* --- STANDARD ACTIONS --- */
        <View style={styles.buttonRow}>
          {myPlayer?.timeBank > 0 && (
            <TouchableOpacity
              style={styles.timeBankBtn}
              onPress={handleTimeBank}
            >
              <Text style={styles.timeBtnText}>TIME</Text>
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
              {currentBet === 0 ? "BET" : "RAISE"}
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
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 1,
    height: 55,
    marginHorizontal: 5,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    elevation: 5,
  },
  foldBtn: { backgroundColor: "#d9534f" },
  callBtn: { backgroundColor: "#5bc0de" },
  raiseBtn: { backgroundColor: "#5cb85c" },
  muckBtnFull: {
    backgroundColor: "#666",
    height: 55,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    width: "100%",
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    textTransform: "uppercase",
  },
  raiseMenu: {
    backgroundColor: "rgba(0,0,0,0.95)",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "#444",
  },
  raiseAmountText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  quickBetRow: { flexDirection: "row", marginVertical: SPACING.md },
  quickBtn: {
    backgroundColor: "#222",
    paddingVertical: 12,
    flex: 1,
    marginHorizontal: 4,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  quickBtnText: { color: "#FFD700", fontWeight: "800", fontSize: 12 },
  confirmRaiseRow: { flexDirection: "row", alignItems: "center" },
  backBtn: { padding: SPACING.md },
  backBtnText: { color: "#aaa", fontWeight: "bold" },
  confirmRaiseBtn: {
    flex: 1,
    backgroundColor: "#5cb85c",
    height: 50,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
  },
  timeBankBtn: {
    backgroundColor: "#4a90e2",
    width: 60,
    height: 55,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    marginRight: 5,
  },
  timeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 10 },
});
