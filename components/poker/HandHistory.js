import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function HandHistory({ visible, onClose, history }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>HAND HISTORY</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.logScroll}>
            {history.map((msg, i) => (
              <View key={i} style={styles.logItem}>
                <Text style={styles.logText}>• {msg}</Text>
              </View>
            ))}
            {history.length === 0 && (
              <Text style={styles.emptyText}>No actions recorded yet.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    height: "50%",
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 10,
  },
  title: { color: COLORS.primary, fontWeight: "bold" },
  closeText: { color: "#fff", fontWeight: "bold" },
  logItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  logText: { color: "#ccc", fontSize: 13 },
  emptyText: { color: "#666", textAlign: "center", marginTop: 20 },
});
