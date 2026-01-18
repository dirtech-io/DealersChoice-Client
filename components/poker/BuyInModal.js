import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function BuyInModal({
  visible,
  onClose,
  onConfirm,
  tableMin = 0,
  tableMax = 0,
  clubId,
  user,
}) {
  /**
   * --- Pull Specific Club Gems Balance ---
   * Adjusted to handle the gems array of objects and Decimal128 type
   */
  const clubBalance = useMemo(() => {
    if (!user || !clubId || !user.gems) return 0;

    // Find the gem object that matches the current clubId
    const gemEntry = user.gems.find((g) => g.clubId === clubId);

    if (!gemEntry || !gemEntry.balance) return 0;

    // Handle MongoDB Decimal128 (often arrives as {$numberDecimal: "X"} or a string)
    const rawValue = gemEntry.balance;
    const numericBalance =
      typeof rawValue === "object" && rawValue.$numberDecimal
        ? parseFloat(rawValue.$numberDecimal)
        : parseFloat(rawValue.toString());

    return isNaN(numericBalance) ? 0 : numericBalance;
  }, [user, clubId, visible]);

  // Determine the actual limits for the slider based on table rules and user wallet
  const maxPossible = Math.min(tableMax, clubBalance);
  const canAffordMin = clubBalance >= tableMin;

  const [amount, setAmount] = useState(tableMin);

  // Reset amount when modal opens
  useEffect(() => {
    if (visible) {
      // Set to max affordable buy-in by default for a better UX
      setAmount(canAffordMin ? maxPossible : tableMin);
    }
  }, [visible, tableMin, tableMax, clubBalance]);

  const handleConfirm = () => {
    if (!canAffordMin) {
      return Alert.alert(
        "Insufficient Balance",
        `You need at least ${tableMin} Gems to sit. You currently have ${clubBalance.toFixed(2)} Gems in this club.`,
      );
    }
    // We pass the floored value for sitting, but use precise math for balance checks
    onConfirm(Math.floor(amount));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>TABLE BUY-IN</Text>

          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>CLUB GEMS:</Text>
            <Text style={styles.goldText}>
              {clubBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={styles.amountDisplay}>
            <Text style={styles.amountText}>
              {Math.floor(amount).toLocaleString()}
            </Text>
            <Text style={styles.gemSuffix}>GEMS TO DEPOSIT</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={tableMin}
            maximumValue={maxPossible > tableMin ? maxPossible : tableMin + 0.1}
            step={1}
            value={amount}
            onValueChange={setAmount}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#333"
            thumbTintColor={COLORS.primary}
            disabled={!canAffordMin}
          />

          <View style={styles.limitRow}>
            <TouchableOpacity
              onPress={() => setAmount(tableMin)}
              style={styles.quickSelect}
              disabled={!canAffordMin}
            >
              <Text style={styles.limitText}>MIN: {tableMin}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAmount(maxPossible)}
              style={styles.quickSelect}
              disabled={!canAffordMin}
            >
              <Text
                style={[
                  styles.limitText,
                  clubBalance < tableMax &&
                    canAffordMin && { color: COLORS.primary },
                ]}
              >
                {clubBalance < tableMax && canAffordMin
                  ? `MY MAX: ${Math.floor(clubBalance)}`
                  : `TABLE MAX: ${tableMax}`}
              </Text>
            </TouchableOpacity>
          </View>

          {!canAffordMin && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Minimum buy-in is {tableMin} Gems.{"\n"}Please contact a club
                manager to top up.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, !canAffordMin && styles.disabledBtn]}
            onPress={handleConfirm}
            disabled={!canAffordMin}
          >
            <Text style={styles.confirmBtnText}>CONFIRM & SIT</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  content: {
    backgroundColor: "#1A1A1A",
    borderRadius: RADIUS.lg,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    elevation: 20,
  },
  title: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 20,
  },
  balanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  balanceLabel: {
    color: "#888",
    fontSize: 10,
    fontWeight: "bold",
    marginRight: 8,
  },
  goldText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 16,
  },
  amountDisplay: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    width: "100%",
    paddingVertical: 20,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 10,
  },
  amountText: {
    color: "#FFF",
    fontSize: 48,
    fontWeight: "900",
  },
  gemSuffix: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
    marginTop: -5,
  },
  slider: {
    width: "105%",
    height: 50,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 5,
  },
  quickSelect: {
    padding: 5,
  },
  limitText: {
    color: "#AAA",
    fontSize: 11,
    fontWeight: "700",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    padding: 12,
    borderRadius: RADIUS.sm,
    marginTop: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.2)",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 18,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    padding: 18,
    borderRadius: RADIUS.md,
    marginTop: 25,
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: "#222",
    opacity: 0.5,
  },
  confirmBtnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
  },
  cancelBtn: {
    marginTop: 20,
    padding: 10,
  },
  cancelText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
});
