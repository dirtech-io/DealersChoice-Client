import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  SafeAreaView,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import * as Haptics from "expo-haptics";

export default function SettingsModal({
  visible,
  onClose,
  settings,
  updateSettings,
}) {
  const toggleSetting = (key) => {
    const newValue = !settings[key];
    updateSettings(key, newValue);

    // Provide physical feedback when changing settings
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>GAME SETTINGS</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* SOUND SETTING */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <Text style={styles.settingSubLabel}>
                  Dealer voice, chips, and card flips
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#333", true: COLORS.primary + "80" }}
                thumbColor={settings.soundEnabled ? COLORS.primary : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => toggleSetting("soundEnabled")}
                value={settings.soundEnabled}
              />
            </View>

            <View style={styles.divider} />

            {/* HAPTICS SETTING */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingSubLabel}>
                  Physical vibration on slider and actions
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#333", true: COLORS.primary + "80" }}
                thumbColor={
                  settings.hapticsEnabled ? COLORS.primary : "#f4f3f4"
                }
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => toggleSetting("hapticsEnabled")}
                value={settings.hapticsEnabled}
              />
            </View>

            <View style={styles.divider} />

            {/* AUTO-MUCK SETTING */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Muck</Text>
                <Text style={styles.settingSubLabel}>
                  Hide losing hands automatically
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#333", true: COLORS.primary + "80" }}
                thumbColor={settings.autoMuck ? COLORS.primary : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => toggleSetting("autoMuck")}
                value={settings.autoMuck}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.leaveTableBtn} onPress={onClose}>
            <Text style={styles.leaveTableText}>BACK TO GAME</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>v1.0.4 - Secure Poker Protocol</Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  container: {
    marginHorizontal: SPACING.lg,
    backgroundColor: "#111",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    backgroundColor: "#1A1A1A",
  },
  title: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  closeBtn: {
    padding: 5,
  },
  closeBtnText: {
    color: "#888",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    padding: SPACING.md,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  settingSubLabel: {
    color: "#666",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#222",
    width: "100%",
  },
  leaveTableBtn: {
    backgroundColor: "#222",
    margin: SPACING.md,
    padding: 15,
    borderRadius: RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  leaveTableText: {
    color: "#FFF",
    fontWeight: "800",
    letterSpacing: 1,
  },
  versionText: {
    color: "#333",
    fontSize: 10,
    textAlign: "center",
    marginBottom: SPACING.md,
    fontWeight: "bold",
  },
});
