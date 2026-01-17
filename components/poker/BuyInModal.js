import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider"; // You may need to: npx expo install @react-native-community/slider
import { COLORS, SPACING, RADIUS } from "../styles/theme";

export default function BuyInModal({
  visible,
  onClose,
  onConfirm,
  tableMin,
  tableMax,
  userBalance,
}) {
  // Determine the actual limits for the slider
  const maxPossible = Math.min(tableMax, userBalance);
  const [amount, setAmount] = useState(tableMin);

  // Reset amount when modal opens
  useEffect(() => {
    if (visible) {
      setAmount(tableMin);
    }
  }, [visible, tableMin]);

  const handleConfirm = () => {
    if (userBalance < tableMin) {
      return Alert.alert(
        "Insufficient Balance",
        "You don't have enough chips to join this table.",
      );
    }
    onConfirm(amount);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>CHIP BUY-IN</Text>

          <Text style={styles.balanceLabel}>
            Club Balance: <Text style={styles.goldText}>${userBalance}</Text>
          </Text>

          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>${Math.floor(amount)}</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={tableMin}
            maximumValue={maxPossible > tableMin ? maxPossible : tableMin + 1}
            step={1}
            value={amount}
            onValueChange={setAmount}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#333"
            thumbTintColor={COLORS.primary}
            disabled={userBalance < tableMin}
          />

          <View style={styles.limitRow}>
            <Text style={styles.limitText}>Min: ${tableMin}</Text>
            <Text style={styles.limitText}>Max: ${tableMax}</Text>
          </View>

          {userBalance < tableMin && (
            <Text style={styles.errorText}>
              Warning: Your balance is below the minimum buy-in.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              userBalance < tableMin && styles.disabledBtn,
            ]}
            onPress={handleConfirm}
            disabled={userBalance < tableMin}
          >
            <Text style={styles.confirmBtnText}>SIT DOWN</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
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
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  content: {
    backgroundColor: "#111",
    borderRadius: RADIUS.lg,
    padding: 25,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  title: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
  },
  balanceLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  goldText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  amountContainer: {
    backgroundColor: "#000",
    width: "100%",
    padding: 20,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  amountText: {
    color: COLORS.textMain,
    fontSize: 32,
    fontWeight: "bold",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 5,
  },
  limitText: {
    color: "#666",
    fontSize: 12,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 15,
    textAlign: "center",
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
    backgroundColor: "#444",
  },
  confirmBtnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
  cancelText: {
    color: "#888",
    marginTop: 20,
    fontWeight: "bold",
  },
});
