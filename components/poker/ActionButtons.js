import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";
import RaiseSlider from "./RaiseSlider";
import * as Haptics from "expo-haptics";

export default function ActionButtons({
  tableData,
  myPlayer,
  onAction,
  socket,
  settings,
  isDiscardMode,
  discardSelection,
  onConfirmDiscard,
}) {
  const [showRaiseMenu, setShowRaiseMenu] = useState(false);

  // 1. HELPERS & CONSTANTS
  const isMyTurn = tableData.actingIndex === myPlayer?.seatIndex;
  const isShowdown = tableData.currentStreet === "SHOWDOWN";
  const isSittingOut = myPlayer?.isSittingOut;

  const isUserInHand = myPlayer && !myPlayer.folded;
  const isWinner = tableData.lastWinners?.some(
    (w) => w.seatIndex === myPlayer?.seatIndex,
  );

  const currentBet = tableData.currentBet || 0;
  const minRaiseAmount = tableData.minRaiseAmount || 20;
  const myCurrentContribution = myPlayer?.currentStreetBet || 0;
  const playerChips = myPlayer?.chips || 0;

  // Calculate betting requirements
  const callAmount = currentBet - myCurrentContribution;
  const actualCallAmount = Math.min(callAmount, playerChips);
  const isCheck = callAmount <= 0;
  const isAllInCall = actualCallAmount === playerChips && playerChips > 0;

  // Raise Logic
  const minTotalRaise = currentBet + minRaiseAmount;
  const maxTotalRaise = playerChips + myCurrentContribution;
  const pot = tableData.pot || 0;

  const handleAction = (type, amount) => {
    if (settings?.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onAction(type, amount);
  };

  const handleRaiseSubmit = (amount) => {
    handleAction("raise", amount);
    setShowRaiseMenu(false);
  };

  const handleTimeBank = () => {
    if (settings?.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    socket?.emit("useTimeBank", { tableId: tableData.id || tableData._id });
  };

  const handleMuck = () => {
    socket?.emit("muckCards", { tableId: tableData.id || tableData._id });
  };

  const handleSitIn = () => {
    socket?.emit("sitBackIn", { tableId: tableData.id || tableData._id });
  };

  // --- RENDER LOGIC ---

  // 0. Sit Back In (If player is sitting out)
  if (isSittingOut) {
    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.sitInBtn} onPress={handleSitIn}>
          <Text style={styles.btnText}>I'M BACK - SIT IN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 1. Showdown View
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

  // 2. Discarding View (Highest Priority during turn)
  if (isDiscardMode && isMyTurn) {
    const discardCount = discardSelection?.length || 0;
    const maxDiscard = tableData.gameType === "DRAW" ? 3 : 1; // Simplified example logic

    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.discardConfirmBtn,
            discardCount === 0 &&
              tableData.gameType?.includes("PINEAPPLE") &&
              styles.disabledBtn,
          ]}
          onPress={onConfirmDiscard}
          disabled={
            discardCount === 0 && tableData.gameType?.includes("PINEAPPLE")
          }
        >
          <Text style={styles.btnText}>
            {discardCount === 0
              ? "STAND PAT"
              : `DISCARD ${discardCount} CARD${discardCount !== 1 ? "S" : ""}`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Not My Turn
  if (!isMyTurn) return null;

  // 4. Standard Betting View
  return (
    <View style={styles.actionContainer}>
      {showRaiseMenu ? (
        <RaiseSlider
          min={minTotalRaise}
          max={maxTotalRaise}
          currentPot={pot}
          onRaise={handleRaiseSubmit}
          onClose={() => setShowRaiseMenu(false)}
          hapticsEnabled={settings?.hapticsEnabled}
        />
      ) : (
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
            onPress={() => handleAction("fold")}
          >
            <Text style={styles.btnText}>FOLD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={() => handleAction("call")}
          >
            <Text style={styles.btnText}>
              {isCheck
                ? "CHECK"
                : isAllInCall
                  ? `ALL-IN $${actualCallAmount}`
                  : `CALL $${actualCallAmount}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.raiseBtn,
              playerChips <= actualCallAmount && styles.disabledBtn,
            ]}
            onPress={() => {
              if (settings?.hapticsEnabled) Haptics.selectionAsync();
              setShowRaiseMenu(true);
            }}
            disabled={playerChips <= actualCallAmount}
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
    bottom: 25,
    width: "100%",
    paddingHorizontal: SPACING.sm,
    zIndex: 100,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBtn: {
    flex: 1,
    height: 60,
    marginHorizontal: 4,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    borderBottomWidth: 4,
  },
  foldBtn: { backgroundColor: "#CC0000", borderBottomColor: "#880000" },
  callBtn: { backgroundColor: "#2E5BFF", borderBottomColor: "#1A3BA8" },
  raiseBtn: { backgroundColor: "#28A745", borderBottomColor: "#1A6B2D" },
  sitInBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    borderBottomWidth: 4,
    borderBottomColor: "#B89600",
  },
  discardConfirmBtn: {
    backgroundColor: COLORS.primary,
    borderBottomColor: "#B89600",
    width: "100%",
  },
  disabledBtn: {
    backgroundColor: "#333",
    borderBottomColor: "#111",
    opacity: 0.5,
  },
  muckBtnFull: {
    backgroundColor: "#444",
    height: 55,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    width: "100%",
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
    textTransform: "uppercase",
  },
  timeBankBtn: {
    backgroundColor: "#f0ad4e",
    width: 50,
    height: 60,
    borderRadius: RADIUS.md,
    ...globalStyles.centered,
    marginRight: 4,
    borderBottomWidth: 4,
    borderBottomColor: "#8a6d3b",
  },
  timeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 10 },
});
