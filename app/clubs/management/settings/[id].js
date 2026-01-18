import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API_BASE } from "../../../../api/config";
import { COLORS, SPACING, RADIUS } from "../../../../styles/theme";

export default function ClubSettings() {
  const { id: clubId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    fetchClubSettings();
  }, []);

  const fetchClubSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/clubs/${clubId}`);
      const data = await res.json();
      setName(data.name);
      setInviteCode(data.inviteCode);
    } catch (error) {
      Alert.alert("Error", "Could not load settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !inviteCode) {
      return Alert.alert("Required", "Please fill in all fields.");
    }

    if (inviteCode.length < 4) {
      return Alert.alert(
        "Invalid Code",
        "Invite code must be at least 4 characters.",
      );
    }

    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/clubs/${clubId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newName: name,
          newInviteCode: inviteCode.toUpperCase(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Club settings updated.");
        router.back();
      } else {
        Alert.alert("Error", result.message || "Update failed.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CLUB SETTINGS</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CLUB NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. The Shark Tank"
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CUSTOM INVITE CODE</Text>
          <TextInput
            style={[
              styles.input,
              { color: COLORS.primary, fontWeight: "bold" },
            ]}
            value={inviteCode}
            onChangeText={(val) =>
              setInviteCode(val.replace(/\s/g, "").toUpperCase())
            }
            placeholder="e.g. SHARK123"
            placeholderTextColor="#444"
            maxLength={12}
            autoCapitalize="characters"
          />
          <Text style={styles.helperText}>
            Existing members will stay in the club even if you change this code.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, updating && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  backLink: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
    marginRight: 20,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },

  form: { flex: 1 },
  inputGroup: { marginBottom: 25 },
  label: {
    color: "#666",
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
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  helperText: {
    color: "#444",
    fontSize: 11,
    marginTop: 8,
    fontStyle: "italic",
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
});
