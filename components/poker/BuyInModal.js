import React, { useState, useEffect } from "react";
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
  userBalance = 0,
}) {
  // Determine the actual limits for the slider
  const maxPossible = Math.min(tableMax, userBalance);
  const canAffordMin = userBalance >= tableMin;

  const [amount, setAmount] = useState(tableMin);

  // Reset amount when modal opens to the highest possible value up to tableMax
  useEffect(() => {
    if (visible) {
      setAmount(canAffordMin ? Math.min(tableMax, userBalance) : tableMin);
    }
  }, [visible, tableMin, tableMax, userBalance]);

  const handleConfirm = () => {
    if (!canAffordMin) {
      return Alert.alert(
        "Insufficient Balance",
        "You don't have enough chips in your wallet to meet the minimum buy-in.",
      );
    }
    onConfirm(Math.floor(amount));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>TABLE BUY-IN</Text>

          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>YOUR BALANCE:</Text>
            <Text style={styles.goldText}>${userBalance.toLocaleString()}</Text>
          </View>

          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.amountText}>
              {Math.floor(amount).toLocaleString()}
            </Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={tableMin}
            maximumValue={
              maxPossible > tableMin ? maxPossible : tableMin + 0.01
            }
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
            >
              <Text style={styles.limitText}>MIN: ${tableMin}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAmount(maxPossible)}
              style={styles.quickSelect}
            >
              <Text style={styles.limitText}>MAX: ${maxPossible}</Text>
            </TouchableOpacity>
          </View>

          {!canAffordMin && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Minimum buy-in is ${tableMin}. Please top up your balance.
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
    backgroundColor: "rgba(0,0,0,0.9)",
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
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 20,
  },
  balanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  balanceLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 8,
  },
  goldText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 16,
  },
  amountDisplay: {
    flexDirection: "row",
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
  currencySymbol: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
    marginRight: 4,
    marginTop: 4,
  },
  amountText: {
    color: "#FFF",
    fontSize: 42,
    fontWeight: "900",
  },
  slider: {
    width: "110%", // Make slider slightly wider for easier thumb grabbing
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
    fontSize: 12,
    fontWeight: "700",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    padding: 10,
    borderRadius: RADIUS.sm,
    marginTop: 20,
    width: "100%",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    padding: 18,
    borderRadius: RADIUS.md,
    marginTop: 25,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  disabledBtn: {
    backgroundColor: "#333",
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
    fontSize: 14,
    textTransform: "uppercase",
  },
});
