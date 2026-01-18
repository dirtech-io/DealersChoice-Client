import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API_BASE, supabase } from "../../../api/config";
import { COLORS, SPACING, RADIUS } from "../../../styles/theme";

export default function ClubManagement() {
  const { id: clubId } = useLocalSearchParams();
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [clubData, setClubData] = useState(null);
  const [userRole, setUserRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchClubAndMembers();
  }, [clubId]);

  const fetchClubAndMembers = async () => {
    try {
      const clubRes = await fetch(`${API_BASE}/clubs/${clubId}`);
      const cData = await clubRes.json();
      setClubData(cData);

      const res = await fetch(`${API_BASE}/clubs/${clubId}/members`);
      const data = await res.json();
      setMembers(data);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const me = data.find((m) => m.supabase_id === user.id);
      if (me) setUserRole(me.role);
    } catch (error) {
      console.error("Management fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClubAndMembers();
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    Alert.alert("Confirm Role Change", `Make this user a ${newRole}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            const response = await fetch(
              `${API_BASE}/clubs/${clubId}/members/role`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  targetUserId,
                  newRole,
                  requesterSupabaseId: user.id,
                }),
              },
            );

            if (response.ok) {
              Alert.alert("Success", "Role updated.");
              fetchClubAndMembers();
            }
          } catch (error) {
            Alert.alert("Error", "Network error.");
          }
        },
      },
    ]);
  };

  const handleRemove = (targetUserId, username) => {
    Alert.alert("Remove Member", `Remove ${username} from the club?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const response = await fetch(
              `${API_BASE}/clubs/${clubId}/members/remove`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  targetUserId,
                  requesterSupabaseId: user.id,
                }),
              },
            );

            if (response.ok) {
              Alert.alert("Success", "Member removed.");
              fetchClubAndMembers();
            }
          } catch (error) {
            Alert.alert("Error", "Server error.");
          }
        },
      },
    ]);
  };

  const onShareInvite = async () => {
    try {
      await Share.share({
        message: `Join my private Dealer's Choice poker club! \n\nInvite Code: ${clubData?.inviteCode}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not open share menu.");
    }
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.title}>{clubData?.name || "Club Management"}</Text>

      <View style={styles.dashboardGrid}>
        <TouchableOpacity
          style={styles.dashCard}
          onPress={() => router.push(`/clubs/management/logs/${clubId}`)}
        >
          <Text style={styles.dashIcon}>📜</Text>
          <Text style={styles.dashLabel}>Audit Logs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dashCard}
          onPress={() => router.push(`/clubs/management/settings/${clubId}`)}
        >
          <Text style={styles.dashIcon}>⚙️</Text>
          <Text style={styles.dashLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* NEW: Table Management Section */}
      <TouchableOpacity
        style={styles.wideDashCard}
        onPress={() =>
          router.push(`/clubs/management/tables/create?clubId=${clubId}`)
        }
      >
        <Text style={styles.dashIcon}>♠️</Text>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.dashLabel}>Create New Table</Text>
          <Text style={styles.dashSublabel}>Start a new cash game</Text>
        </View>
      </TouchableOpacity>

      {(userRole === "owner" || userRole === "manager") && clubData && (
        <View style={styles.shareContainer}>
          <View style={styles.codeDisplay}>
            <Text style={styles.label}>INVITE CODE</Text>
            <Text style={styles.codeText}>{clubData.inviteCode}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={onShareInvite}>
            <Text style={styles.shareBtnText}>SHARE</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionSubtitle}>
        Club Members ({members.length})
      </Text>
    </View>
  );

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => {
          const isTargetStaff =
            item.role === "owner" || item.role === "manager";
          const canManage =
            (userRole === "owner" && item.role !== "owner") ||
            (userRole === "manager" && !isTargetStaff);

          return (
            <View style={styles.memberCard}>
              <TouchableOpacity
                style={styles.memberInfo}
                onPress={() =>
                  router.push(
                    `/clubs/management/members/${item.userId}?clubId=${clubId}`,
                  )
                }
              >
                <Text style={styles.username}>{item.username}</Text>
                <Text
                  style={[
                    styles.roleTag,
                    isTargetStaff && { color: COLORS.primary },
                  ]}
                >
                  {item.role.toUpperCase()} • {item.gems || 0} 💎
                </Text>
              </TouchableOpacity>

              {canManage && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() =>
                      handleRoleChange(
                        item.userId,
                        item.role === "manager" ? "member" : "manager",
                      )
                    }
                  >
                    <Text style={styles.actionText}>
                      {item.role === "manager" ? "DEMOTE" : "PROMOTE"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemove(item.userId, item.username)}
                  >
                    <Text style={styles.dangerActionText}>KICK</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  headerSection: { paddingTop: 60 },
  title: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: SPACING.md,
  },
  dashboardGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  dashCard: {
    backgroundColor: "#1A1A1A",
    width: "48%",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  wideDashCard: {
    backgroundColor: "#1A1A1A",
    width: "100%",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  dashIcon: { fontSize: 24 },
  dashLabel: { color: "#FFF", fontSize: 13, fontWeight: "bold" },
  dashSublabel: { color: "#666", fontSize: 11 },
  shareContainer: {
    flexDirection: "row",
    backgroundColor: "#000",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: "#222",
  },
  codeDisplay: { flex: 1 },
  label: { color: "#666", fontSize: 10, fontWeight: "bold" },
  codeText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  shareBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: RADIUS.sm,
  },
  shareBtnText: { color: "#000", fontWeight: "bold", fontSize: 12 },
  sectionSubtitle: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#151515",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  memberInfo: { flex: 1 },
  username: { color: COLORS.textMain, fontSize: 16, fontWeight: "bold" },
  roleTag: { color: "#AAA", fontSize: 10, fontWeight: "900", marginTop: 4 },
  actionsRow: { flexDirection: "row", alignItems: "center" },
  actionText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 15,
  },
  dangerActionText: {
    color: "#FF5252",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 15,
  },
});
