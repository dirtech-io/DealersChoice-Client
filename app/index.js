import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../api/config";
import { useAuth } from "../context/auth";

import { COLORS, SPACING, RADIUS } from "../styles/theme";
import { globalStyles } from "../styles/global";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // XP & Level Logic constants
  const XP_PER_LEVEL = 1000;
  const currentLevel = profile?.level || 1;
  const currentXP = profile?.xp || 0;
  const progressPercent = (currentXP / XP_PER_LEVEL) * 100;
  const xpDisplay = `${currentXP} / ${XP_PER_LEVEL} XP`;

  return (
    <SafeAreaView style={styles.container}>
      {/* --- GAMIFIED HEADER --- */}
      <View style={styles.gamifiedHeader}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile?.username?.charAt(0).toUpperCase() || "P"}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{currentLevel}</Text>
              </View>
            </View>
            <View style={styles.nameSection}>
              <Text style={styles.username}>
                {profile?.username || "PLAYER"}
              </Text>
              <View style={styles.xpContainer}>
                <View
                  style={[styles.xpBar, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={{ color: "#666", fontSize: 10, marginTop: 2 }}>
                {xpDisplay}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutIconButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Updated Currency Row - Centered and Single Currency */}
        <View style={styles.currencyRow}>
          <View style={styles.currencyPill}>
            <Text style={styles.currencyIcon}>
              <FontAwesome5 name="coins" size={24} color="gold" />
            </Text>
            <Text style={styles.currencyValue}>
              {profile?.coins?.toLocaleString() ?? 0}
            </Text>
            <TouchableOpacity style={styles.plusButton}>
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.menuGrid}>
        <View style={styles.row}>
          <MenuCard
            title="CLUBS"
            subtitle="PRIVATE TABLES"
            icon="🏰"
            color="#4A90E2"
            onPress={() => router.push("/clubs/")}
          />
          <MenuCard
            title="POKER"
            subtitle="PUBLIC TABLES"
            icon="🃏"
            color="#E2B43B"
            onPress={() => router.push("/poker-lobby")}
          />
        </View>

        <View style={styles.row}>
          <MenuCard
            title="CASINO"
            subtitle="SLOTS & MORE"
            icon="🎰"
            color="#D0021B"
            onPress={() => {}}
          />
          <MenuCard
            title="OTHER GAMES"
            subtitle="COMING SOON"
            icon="♠️"
            color="#7ED321"
            onPress={() => {}}
          />
        </View>

        <TouchableOpacity style={styles.dailyBonus}>
          <Text style={styles.dailyTitle}>COLLECT DAILY REWARD</Text>
          <Text style={styles.dailyTimer}>READY IN 02:45:12</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuCard = ({ title, subtitle, icon, color, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderColor: color }]}
    onPress={onPress}
  >
    <Text style={styles.cardIcon}>{icon}</Text>
    <View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gamifiedHeader: {
    padding: SPACING.md,
    backgroundColor: "#151515",
    borderBottomWidth: 2,
    borderBottomColor: "#252525",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
    ...globalStyles.centered,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: "bold",
  },
  levelBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.round,
    width: 20,
    height: 20,
    ...globalStyles.centered,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
  },
  nameSection: {
    marginLeft: SPACING.sm,
  },
  username: {
    color: COLORS.textMain,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  xpContainer: {
    width: 100,
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    overflow: "hidden",
  },
  xpBar: {
    height: "100%",
    backgroundColor: COLORS.raise,
  },
  logoutIconButton: {
    padding: 5,
  },
  logoutIcon: {
    color: COLORS.textSecondary,
    fontSize: 20,
  },
  currencyRow: {
    flexDirection: "row",
    justifyContent: "center", // Centered for cleaner look
  },
  currencyPill: {
    flexDirection: "row",
    backgroundColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.round,
    alignItems: "center",
    width: width * 0.5, // Slightly wider since it's the only one
    borderWidth: 1,
    borderColor: "#333",
  },
  currencyIcon: {
    marginRight: 8,
  },
  currencyValue: {
    color: COLORS.textMain,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  plusButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    width: 20,
    height: 20,
    ...globalStyles.centered,
  },
  plusText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  menuGrid: {
    padding: SPACING.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: "rgba(41,42,51,1)",
    width: "48%",
    height: 120,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    textAlign: "center",
  },
  cardIcon: {
    fontSize: 24,
    textAlign: "center",
  },
  cardTitle: {
    color: COLORS.textMain,
    fontWeight: "900",
    fontSize: 18,
    textAlign: "center",
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },

  dailyBonus: {
    backgroundColor: "#252525",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
  },
  dailyTitle: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 16,
  },
  dailyTimer: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
});
