import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function HandHistory({ visible, onClose, history = [] }) {
  const scrollViewRef = useRef();

  // Auto-scroll to bottom when history updates or modal opens
  useEffect(() => {
    if (visible && history.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, history]);

  // Helper to colorize specific poker keywords
  const getLogTextStyle = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("win") || lower.includes("pot"))
      return { color: COLORS.primary, fontWeight: "800" };
    if (lower.includes("raise") || lower.includes("bet"))
      return { color: "#4cd137", fontWeight: "600" };
    if (lower.includes("fold")) return { color: "#e84118" };
    if (lower.includes("all-in"))
      return { color: "#fbc531", fontWeight: "bold" };
    return { color: "#dcdde1" };
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />

        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.historyIcon} />
              <Text style={styles.title}>LIVE ACTION LOG</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>DONE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.logScroll}
            contentContainerStyle={styles.scrollContent}
          >
            {history.map((msg, i) => (
              <View key={i} style={styles.logItem}>
                <Text style={styles.timestamp}>
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
                <Text style={[styles.logText, getLogTextStyle(msg)]}>
                  {msg}
                </Text>
              </View>
            ))}

            {history.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hands recorded in this session.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    height: "60%",
    backgroundColor: "#121212",
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#333",
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  title: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  closeBtn: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  closeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  logScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  logItem: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    alignItems: "flex-start",
  },
  timestamp: {
    color: "#555",
    fontSize: 10,
    width: 65,
    fontFamily: "monospace",
    marginTop: 2,
  },
  logText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#444",
    fontSize: 14,
    fontWeight: "bold",
  },
});
