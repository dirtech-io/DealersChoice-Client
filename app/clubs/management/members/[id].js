import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API_BASE } from "../../../../api/config";
import { COLORS, SPACING, RADIUS } from "../../../../styles/theme";

export default function MemberDetail() {
  const { id: targetUserId, clubId } = useLocalSearchParams();
  const router = useRouter();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gemAmount, setGemAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMemberDetails();
  }, []);

  const fetchMemberDetails = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/clubs/${clubId}/members/${targetUserId}`,
      );
      const data = await res.json();
      setMember(data);
    } catch (error) {
      Alert.alert("Error", "Could not fetch member details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGems = async (actionType) => {
    const amount = parseFloat(gemAmount);
    if (!amount || amount <= 0) {
      return Alert.alert(
        "Invalid Amount",
        "Please enter a valid number of gems.",
      );
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `${API_BASE}/clubs/${clubId}/members/adjust-gems`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId,
            amount: actionType === "ADD" ? amount : -amount,
            type: actionType === "ADD" ? "MANUAL_DEPOSIT" : "MANUAL_WITHDRAWAL",
          }),
        },
      );

      if (response.ok) {
        Alert.alert(
          "Success",
          `Gems ${actionType === "ADD" ? "added" : "removed"} successfully.`,
        );
        setGemAmount("");
        fetchMemberDetails(); // Refresh balance
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message);
      }
    } catch (err) {
      Alert.alert("Error", "Network error.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← BACK TO MEMBERS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {member?.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{member?.username}</Text>
        <Text style={styles.roleTag}>{member?.role.toUpperCase()}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>CURRENT CLUB BALANCE</Text>
        <Text style={styles.balanceValue}>{member?.gems || 0} 💎</Text>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.inputLabel}>ADJUST GEM BALANCE</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount..."
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={gemAmount}
          onChangeText={setGemAmount}
        />

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.addBtn]}
            onPress={() => handleUpdateGems("ADD")}
            disabled={processing}
          >
            <Text style={styles.btnText}>ADD GEMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.removeBtn]}
            onPress={() => handleUpdateGems("REMOVE")}
            disabled={processing}
          >
            <Text style={styles.btnText}>REMOVE GEMS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: { marginTop: 40, marginBottom: 20 },
  backLink: { color: COLORS.primary, fontWeight: "bold", fontSize: 12 },
  profileSection: { alignItems: "center", marginBottom: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#000" },
  username: { color: "#FFF", fontSize: 24, fontWeight: "bold" },
  roleTag: { color: "#AAA", fontSize: 12, marginTop: 4, letterSpacing: 1 },
  balanceCard: {
    backgroundColor: "#1A1A1A",
    padding: 25,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  balanceLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
  },
  balanceValue: { color: COLORS.primary, fontSize: 36, fontWeight: "900" },
  actionCard: { backgroundColor: "#111", padding: 20, borderRadius: RADIUS.lg },
  inputLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#000",
    color: "#FFF",
    padding: 15,
    borderRadius: RADIUS.md,
    fontSize: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  btnRow: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 0.48,
    padding: 15,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  addBtn: { backgroundColor: "#4CAF50" },
  removeBtn: { backgroundColor: "#FF5252" },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
});
