import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, API_BASE } from "../../api/config";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";

export default function ClubsLobby() {
  const router = useRouter();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Form States
  const [inviteCode, setInviteCode] = useState("");
  const [newClubName, setNewClubName] = useState("");
  const [customInviteCode, setCustomInviteCode] = useState("");

  useEffect(() => {
    fetchUserClubs();
  }, []);

  const fetchUserClubs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch(`${API_BASE}/users/${user.id}/clubs`);
        const data = await response.json();
        setClubs(data);
      }
    } catch (error) {
      console.error("Error fetching clubs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async () => {
    if (inviteCode.length !== 6) {
      Alert.alert("Invalid Code", "Invite codes must be exactly 6 characters.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const response = await fetch(`${API_BASE}/clubs/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabase_id: user.id,
          inviteCode: inviteCode.toUpperCase(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", `Welcome to ${result.clubName}!`);
        setJoinModalVisible(false);
        setInviteCode("");
        fetchUserClubs();
      } else {
        Alert.alert("Join Failed", result.message);
      }
    } catch (err) {
      Alert.alert("Error", "Server connection failed.");
    }
  };

  const handleCreateClub = async () => {
    if (!newClubName || customInviteCode.length !== 6) {
      Alert.alert(
        "Missing Info",
        "Provide a club name and a 6-character code."
      );
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const response = await fetch(`${API_BASE}/clubs/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClubName,
          owner_supabase_id: user.id,
          customCode: customInviteCode,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          "Realm Established",
          `Club Created! Code: ${data.club.inviteCode}`
        );
        setCreateModalVisible(false);
        setNewClubName("");
        setCustomInviteCode("");
        fetchUserClubs();
      } else {
        Alert.alert("Creation Failed", data.message);
      }
    } catch (err) {
      Alert.alert("Error", "Server connection failed.");
    }
  };

  const renderClubItem = ({ item }) => (
    <TouchableOpacity
      style={styles.clubCard}
      onPress={() => router.push(`/clubs/lobby?clubId=${item._id}`)}
    >
      <View style={styles.clubIcon}>
        <Text style={styles.iconText}>🏢</Text>
      </View>
      <View style={styles.clubInfo}>
        <Text style={styles.clubName}>{item.name}</Text>
        <Text style={styles.clubCode}>CODE: {item.inviteCode}</Text>
        <Text style={styles.memberCount}>
          {item.members?.length || 0} MEMBERS
        </Text>
      </View>
      <Text style={styles.arrow}>❯</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CLUBS</Text>
          <Text style={styles.subtitle}>MY EMPIRE</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => setJoinModalVisible(true)}
          >
            <Text style={styles.btnText}>JOIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.btnText}>CREATE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={clubs}
        keyExtractor={(item) => item._id}
        renderItem={renderClubItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You haven't joined any poker realms yet.
            </Text>
          </View>
        }
      />

      {/* MODAL: JOIN CLUB */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>ENTER INVITE CODE</Text>
            <TextInput
              style={styles.vanityInput}
              placeholder="POKER1"
              placeholderTextColor="#444"
              maxLength={6}
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={(t) =>
                setInviteCode(t.replace(/[^A-Za-z0-9]/g, ""))
              }
            />
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleJoinClub}
            >
              <Text style={styles.confirmBtnText}>JOIN CLUB</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: CREATE CLUB */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>ESTABLISH REALM</Text>

            <TextInput
              style={styles.standardInput}
              placeholder="Club Name"
              placeholderTextColor="#666"
              value={newClubName}
              onChangeText={setNewClubName}
            />

            <Text style={styles.inputLabel}>CHOOSE VANITY CODE (6 CHARS)</Text>
            <TextInput
              style={styles.vanityInput}
              placeholder="LEGEND"
              placeholderTextColor="#444"
              maxLength={6}
              autoCapitalize="characters"
              value={customInviteCode}
              onChangeText={(t) =>
                setCustomInviteCode(t.replace(/[^A-Za-z0-9]/g, ""))
              }
            />

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: "#FFF" }]}
              onPress={handleCreateClub}
            >
              <Text style={[styles.confirmBtnText, { color: "#000" }]}>
                CREATE CLUB
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    ...globalStyles.centered,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  title: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  headerButtons: {
    flexDirection: "row",
  },
  joinBtn: {
    backgroundColor: COLORS.fold, // Standard dark grey from theme
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  btnText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#000",
  },

  listContent: {
    padding: SPACING.lg,
  },
  clubCard: {
    backgroundColor: "#151515",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#222",
  },
  clubIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: "#222",
    ...globalStyles.centered,
    marginRight: SPACING.md,
  },
  iconText: {
    fontSize: 24,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    color: COLORS.textMain,
    fontWeight: "bold",
    fontSize: 18,
  },
  clubCode: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },
  memberCount: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    fontWeight: "bold",
  },
  arrow: {
    color: COLORS.fold,
    fontSize: 18,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#444",
    textAlign: "center",
  },

  modalOverlay: {
    ...globalStyles.modalOverlay,
    padding: SPACING.lg,
  },
  modalContent: {
    ...globalStyles.modalBox,
    width: "100%", // Box expands to padding limit
    padding: 30,
    alignItems: "center",
  },
  modalHeader: {
    color: COLORS.textMain,
    fontWeight: "900",
    fontSize: 20,
    marginBottom: 25,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  standardInput: {
    width: "100%",
    backgroundColor: "#000",
    color: COLORS.textMain,
    padding: 15,
    borderRadius: RADIUS.md,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "flex-start",
    textTransform: "uppercase",
  },
  vanityInput: {
    width: "100%",
    backgroundColor: "#000",
    color: COLORS.primary,
    padding: 15,
    borderRadius: RADIUS.md,
    textAlign: "center",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 8,
    marginBottom: 25,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    padding: 18,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
  cancelText: {
    color: COLORS.textSecondary,
    marginTop: 20,
    fontWeight: "bold",
  },
});
