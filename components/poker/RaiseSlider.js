import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function RaiseSlider({
  min,
  max,
  currentPot,
  onRaise,
  onClose,
  hapticsEnabled = true,
}) {
  const [value, setValue] = useState(min);

  // Sync value if min changes (e.g., someone else raises while menu is open)
  useEffect(() => {
    if (value < min) setValue(min);
    if (value > max) setValue(max);
  }, [min, max]);

  const handleValueChange = (val) => {
    const rounded = Math.floor(val);
    if (rounded !== value) {
      setValue(rounded);
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleQuickBet = (ratio) => {
    // Logic: Ratio * Pot + the current bet to call
    let amt = Math.floor(currentPot * ratio);

    // Snap to min/max boundaries
    if (amt < min) amt = min;
    if (amt > max) amt = max;

    setValue(amt);
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleConfirm = () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onRaise(value);
  };

  // Determine a sensible step (e.g., don't step by $1 if min raise is $500)
  const dynamicStep = Math.max(
    1,
    Math.pow(10, Math.floor(Math.log10(min)) - 1),
  );

  return (
    <View style={styles.container}>
      {/* QUICK BET SHORTCUTS */}
      <View style={styles.shortcutRow}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => handleQuickBet(0)} // Effectively snaps to min
        >
          <Text style={styles.shortcutText}>MIN</Text>
        </TouchableOpacity>

        {[0.33, 0.5, 1].map((ratio) => (
          <TouchableOpacity
            key={ratio}
            style={styles.shortcutBtn}
            onPress={() => handleQuickBet(ratio)}
          >
            <Text style={styles.shortcutText}>
              {ratio === 1 ? "POT" : `${Math.round(ratio * 100)}%`}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.shortcutBtn, styles.allInBtn]}
          onPress={() => setValue(max)}
        >
          <Text style={[styles.shortcutText, styles.allInText]}>MAX</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.displayArea}>
        <Text style={styles.label}>
          {value === max ? "ALL-IN" : "RAISE TO"}
        </Text>
        <Text style={[styles.amountText, value === max && styles.allInAmount]}>
          ${value.toLocaleString()}
        </Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={dynamicStep}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor={value === max ? "#e74c3c" : COLORS.primary}
        maximumTrackTintColor="#333"
        thumbTintColor={value === max ? "#e74c3c" : COLORS.primary}
      />

      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>MIN: ${min.toLocaleString()}</Text>
        <Text style={styles.rangeText}>MAX: ${max.toLocaleString()}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, value === max && styles.confirmAllIn]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>
            CONFIRM {value === max ? "ALL-IN" : `$${value.toLocaleString()}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  shortcutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  shortcutBtn: {
    backgroundColor: "#222",
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "#444",
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  allInBtn: {
    borderColor: "rgba(231, 76, 60, 0.5)",
  },
  shortcutText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
  },
  allInText: {
    color: "#e74c3c",
  },
  displayArea: {
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    color: "#666",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  amountText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
  },
  allInAmount: {
    color: "#e74c3c",
  },
  slider: {
    width: "100%",
    height: 50,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  rangeText: {
    color: "#555",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelBtn: {
    padding: 15,
    marginRight: 10,
  },
  cancelText: {
    color: "#888",
    fontWeight: "bold",
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  confirmAllIn: {
    backgroundColor: "#e74c3c",
  },
  confirmText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
});
