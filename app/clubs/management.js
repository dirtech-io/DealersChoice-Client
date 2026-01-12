import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { API_BASE, supabase } from "../../api/config";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";

export default function ClubManagement() {
  const { clubId } = useLocalSearchParams();
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState("member");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const res = await fetch(`${API_BASE}/clubs/${clubId}/members`);
    const data = await res.json();
    setMembers(data);

    // Identify current user's role in this list
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const me = data.find((m) => m.supabase_id === user.id);
    if (me) setUserRole(me.role);
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    Alert.alert(
      "Confirm Promotion",
      `Are you sure you want to make this user a ${newRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Promote",
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
                }
              );

              const result = await response.json();
              if (response.ok) {
                Alert.alert("Success", result.message);
                fetchMembers(); // Refresh the list
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              Alert.alert("Error", "Network error while promoting member.");
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }) => {
    const isMe = item.userId === currentMongoUserId; // You'll need to store this
    const isTargetStaff = item.role === "owner" || item.role === "manager";

    const canManage =
      (userRole === "owner" && !isMe) ||
      (userRole === "manager" && !isTargetStaff);
  };

  const handleRemove = (targetUserId, username) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${username} from the club? They will be able to rejoin if they have the invite code.`,
      [
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
                }
              );

              const result = await response.json();

              if (response.ok) {
                Alert.alert("Success", "Member removed.");
                // Refresh the list to reflect the change
                fetchMembers();
              } else {
                Alert.alert(
                  "Error",
                  result.message || "Failed to remove member."
                );
              }
            } catch (error) {
              console.error("Remove Error:", error);
              Alert.alert("Error", "Could not connect to the server.");
            }
          },
        },
      ]
    );
  };

  const handleBlock = (targetUserId, username) => {
    Alert.alert(
      "BLOCK USER",
      `Are you sure you want to block ${username}? They will be removed and unable to re-join with the invite code.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "BLOCK",
          style: "destructive",
          onPress: async () => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const response = await fetch(`${API_BASE}/clubs/${clubId}/block`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                targetUserId,
                requesterSupabaseId: user.id,
              }),
            });

            if (response.ok) {
              Alert.alert("Success", "User has been blacklisted.");
              fetchMembers();
            }
          },
        },
      ]
    );
  };

  const onShareInvite = async () => {
    try {
      const result = await Share.share({
        message: `Join my private Dealer's Choice poker club! \n\nInvite Code: ${clubData.inviteCode}`,
        title: "Club Invitation", // For iOS
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert("Error", "Could not open the share menu.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Member Management</Text>
      {(userRole === "owner" || userRole === "manager") && (
        <View style={styles.shareContainer}>
          <View style={styles.codeDisplay}>
            <Text style={styles.label}>CLUB INVITE CODE</Text>
            <Text style={styles.codeText}>{clubData.inviteCode}</Text>
          </View>

          <TouchableOpacity
            style={styles.shareIconButton}
            onPress={onShareInvite}
          >
            <Text style={styles.shareBtnText}>SHARE CODE</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <View>
              <Text style={styles.username}>{item.username}</Text>
              <Text
                style={[
                  styles.roleTag,
                  isTargetStaff && { color: COLORS.primary },
                ]}
              >
                {item.role.toUpperCase()}
              </Text>
            </View>

            {canManage && (
              <View style={styles.actionColumn}>
                <View style={styles.actionsRow}>
                  {/* Only Owners see Role Promotion */}
                  {userRole === "owner" && (
                    <TouchableOpacity
                      onPress={() =>
                        handleRoleChange(
                          item.userId,
                          item.role === "manager" ? "member" : "manager"
                        )
                      }
                    >
                      <Text style={styles.actionText}>
                        {item.role === "manager" ? "DEMOTE" : "PROMOTE"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(item.userId, item.username)}
                  >
                    <Text style={styles.removeBtnText}>REMOVE</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.blockBtn}
                  onPress={() => handleBlock(item.userId)}
                >
                  <Text style={styles.blockText}>BLOCK USER</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: SPACING.lg,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Ensures vertical alignment
    backgroundColor: "#151515", // Dark card background
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  username: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: "bold",
  },
  roleTag: {
    color: COLORS.primary, // Gold text for roles
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    // Note: 'gap' works in modern React Native, but for backwards compatibility:
    // alignItems: 'center'
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: SPACING.md, // Replaces gap for older RN versions if needed
  },
  // Added a specific style for critical actions (Kick/Ban)
  dangerActionText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: SPACING.md,
  },
});
