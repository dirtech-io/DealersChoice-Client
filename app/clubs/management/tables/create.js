import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API_BASE } from "../../../../api/config";
import { COLORS, SPACING, RADIUS } from "../../../../styles/theme";

const GAME_TYPES = ["NLH", "PLO", "PLO5", "PLO6"];

export default function CreateTable() {
  const { clubId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tableName: "",
    gameType: "NLH",
    smallBlind: "1",
    bigBlind: "2",
    minBuyIn: "40",
    maxBuyIn: "200",
    maxPlayers: "9",
  });

  const handleCreate = async () => {
    // Basic Validation
    if (!form.tableName) return Alert.alert("Error", "Please name the table.");

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/clubs/${clubId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          smallBlind: Number(form.smallBlind),
          bigBlind: Number(form.bigBlind),
          minBuyIn: Number(form.minBuyIn),
          maxBuyIn: Number(form.maxBuyIn),
          maxPlayers: Number(form.maxPlayers),
          status: "active",
          createdAt: new Date(),
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Table created successfully!");
        router.back();
      } else {
        const err = await response.json();
        Alert.alert("Error", err.message || "Failed to create table.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← CANCEL</Text>
        </TouchableOpacity>
        <Text style={styles.title}>CREATE NEW TABLE</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>TABLE NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. The Whale Tank"
          placeholderTextColor="#444"
          value={form.tableName}
          onChangeText={(val) => setForm({ ...form, tableName: val })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>GAME TYPE</Text>
        <View style={styles.chipRow}>
          {GAME_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, form.gameType === type && styles.activeChip]}
              onPress={() => setForm({ ...form, gameType: type })}
            >
              <Text
                style={[
                  styles.chipText,
                  form.gameType === type && styles.activeChipText,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>SMALL BLIND</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.smallBlind}
            onChangeText={(val) => setForm({ ...form, smallBlind: val })}
          />
        </View>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.label}>BIG BLIND</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.bigBlind}
            onChangeText={(val) => setForm({ ...form, bigBlind: val })}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>MIN BUY-IN</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.minBuyIn}
            onChangeText={(val) => setForm({ ...form, minBuyIn: val })}
          />
        </View>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.label}>MAX BUY-IN</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.maxBuyIn}
            onChangeText={(val) => setForm({ ...form, maxBuyIn: val })}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>MAX PLAYERS (2-9)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.maxPlayers}
          onChangeText={(val) => setForm({ ...form, maxPlayers: val })}
        />
      </View>

      <TouchableOpacity
        style={[styles.createBtn, loading && { opacity: 0.5 }]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.createBtnText}>OPEN TABLE</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: { marginTop: 40, marginBottom: 30 },
  backLink: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 10,
  },
  title: { color: "#FFF", fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  section: { marginBottom: 20 },
  label: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#111",
    color: "#FFF",
    padding: 15,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#222",
  },
  row: { flexDirection: "row" },
  chipRow: { flexDirection: "row", justifyContent: "space-between" },
  chip: {
    flex: 1,
    padding: 12,
    backgroundColor: "#111",
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#222",
  },
  activeChip: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  chipText: { color: "#666", fontWeight: "bold", fontSize: 12 },
  activeChipText: { color: COLORS.primary },
  createBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: 20,
  },
  createBtnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
});
