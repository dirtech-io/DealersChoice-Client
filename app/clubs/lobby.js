import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE, supabase } from "../../api/config";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";
import { useSocket } from "../../context/SocketContext";
import BuyInModal from "../../components/poker/BuyInModal";
import { useAuth } from "../../context/auth";

const { width } = Dimensions.get("window");

const GAME_VARIATIONS = [
  { id: "NLH", name: "Hold'em" },
  { id: "PLO", name: "Omaha Hi" },
  { id: "PLO8", name: "Omaha Hi/Lo" },
  { id: "PINE", name: "Pineapple" },
  { id: "TUNK", name: "Tunk" },
  { id: "PYR", name: "Pyramid" },
  { id: "STUD", name: "7-Card Stud" },
];

export default function PokerLobby() {
  const { clubId } = useLocalSearchParams();
  const router = useRouter();
  const socket = useSocket();
  const { profile } = useAuth(); // Access global profile for Gems

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Table Creation State
  const [tableName, setTableName] = useState("");
  const [sb, setSb] = useState("1");
  const [bb, setBb] = useState("2");
  const [selectedGames, setSelectedGames] = useState(["NLH"]);
  const [minBuyIn, setMinBuyIn] = useState("40");
  const [maxBuyIn, setMaxBuyIn] = useState("200");

  const [buyInVisible, setBuyInVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const dotOpacity = useRef(new Animated.Value(1)).current;

  // --- 1. GEMS LOGIC: Extract balance from profile ---
  const userClubBalance = useMemo(() => {
    if (!profile?.Gems || !clubId) return 0;
    const entry = profile.Gems.find(
      (g) => g.clubId.toString() === clubId.toString(),
    );
    return entry ? entry.balance : 0;
  }, [profile, clubId]);

  // --- 2. Fetching Logic ---
  const fetchTables = async () => {
    try {
      const tableRes = await fetch(`${API_BASE}/clubs/${clubId}/tables`);
      const tableData = await tableRes.json();
      setTables(Array.isArray(tableData) ? tableData : []);

      // Check permissions
      const clubRes = await fetch(`${API_BASE}/clubs/${clubId}`);
      const clubData = await clubRes.json();

      if (clubData?.members && profile?.supabase_id) {
        const me = clubData.members.find(
          (m) => m.supabase_id === profile.supabase_id,
        );
        if (
          me &&
          (me.role === "owner" || me.role === "manager" || me.role === "admin")
        ) {
          setIsStaff(true);
        }
      }
    } catch (error) {
      console.error("Lobby fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !clubId) return;

    fetchTables();

    socket.emit("joinClubLobby", { clubId });

    socket.on("clubTablesUpdate", (updatedTables) => {
      setTables(updatedTables);
    });

    return () => {
      socket.off("clubTablesUpdate");
      socket.emit("leaveClubLobby", { clubId });
    };
  }, [clubId, socket]);

  // --- 3. Action Handlers ---
  const handleTableClick = (table) => {
    setSelectedTable(table);
    setBuyInVisible(true);
  };

  const handleFinalSitDown = (amount) => {
    setBuyInVisible(false);
    router.push({
      pathname: `/clubs/tables/${selectedTable._id}`,
      params: {
        buyInAmount: amount,
        clubId: clubId, // Important for the sitDown socket event later
      },
    });
  };

  const handleCreateTable = async () => {
    if (!tableName || !minBuyIn || !maxBuyIn)
      return Alert.alert("Required", "Please fill in all table parameters.");

    try {
      const response = await fetch(
        `${API_BASE}/clubs/${clubId}/tables/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: tableName,
            sb: parseInt(sb),
            bb: parseInt(bb),
            minBuyIn: parseInt(minBuyIn),
            maxBuyIn: parseInt(maxBuyIn),
            allowedGames: selectedGames,
            user_supabase_id: profile.supabase_id,
          }),
        },
      );

      if (response.ok) {
        setCreateModalVisible(false);
        setTableName("");
        fetchTables(); // Refresh list
      } else {
        const result = await response.json();
        Alert.alert("Error", result.message || "Failed to create table");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to server.");
    }
  };

  const toggleGame = (id) => {
    if (selectedGames.includes(id)) {
      if (selectedGames.length > 1)
        setSelectedGames(selectedGames.filter((g) => g !== id));
    } else {
      setSelectedGames([...selectedGames, id]);
    }
  };

  const renderTableItem = ({ item }) => {
    const activePlayers = item.players?.filter((p) => p !== null).length || 0;

    return (
      <TouchableOpacity
        style={styles.tableCard}
        onPress={() => handleTableClick(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tableNameContainer}>
            <Text style={styles.tableName}>{item.name}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ID: {item._id?.slice(-4)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.blindsText}>
            Stakes: ${item.sb}/${item.bb}
          </Text>
          <Text style={styles.buyinRangeText}>
            Buy-in: ${item.minBuyIn} - ${item.maxBuyIn}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.playerCount}>{activePlayers}/9 Players</Text>
          <Text style={styles.joinAction}>TAP TO JOIN ❯</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- NEW GEMS HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>❮</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>CLUB LOBBY</Text>
          <View style={styles.gemPill}>
            <Text style={styles.gemIcon}>💎</Text>
            <Text style={styles.gemValue}>
              {userClubBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {isStaff ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.createBtnText}>+</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderTableItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active tables.</Text>
          }
        />
      )}

      <BuyInModal
        visible={buyInVisible}
        onClose={() => setBuyInVisible(false)}
        onConfirm={handleFinalSitDown}
        tableMin={selectedTable?.minBuyIn || 0}
        tableMax={selectedTable?.maxBuyIn || 0}
        userBalance={userClubBalance}
      />

      {/* Table Creation Modal Code remains mostly same but using styles defined below */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        {/* ... Modal Content (as in your previous code) ... */}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitleContainer: {
    alignItems: "center",
    flex: 1,
  },
  backBtn: { padding: 10 },
  backBtnText: { color: COLORS.textMain, fontSize: 20, fontWeight: "bold" },
  headerTitle: {
    color: COLORS.textMain,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  gemPill: {
    flexDirection: "row",
    backgroundColor: "#000",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: RADIUS.round,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  gemIcon: { fontSize: 12, marginRight: 4 },
  gemValue: { color: COLORS.textMain, fontWeight: "bold", fontSize: 12 },
  createBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  createBtnText: { color: "#000", fontSize: 22, fontWeight: "bold" },
  tableCard: {
    backgroundColor: "#151515",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  tableName: { color: COLORS.textMain, fontSize: 18, fontWeight: "bold" },
  badge: { backgroundColor: "#222", paddingHorizontal: 6, borderRadius: 4 },
  badgeText: { color: "#666", fontSize: 10 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  blindsText: { color: "#AAA", fontSize: 14 },
  buyinRangeText: { color: COLORS.primary, fontSize: 13, fontWeight: "bold" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 10,
  },
  playerCount: { color: COLORS.textSecondary, fontSize: 12 },
  joinAction: { color: COLORS.primary, fontSize: 12, fontWeight: "900" },
  emptyText: { color: "#444", textAlign: "center", marginTop: 50 },
  modalOverlay: { ...globalStyles.modalOverlay, padding: SPACING.lg },
  modalContent: { ...globalStyles.modalBox, width: "100%", padding: 25 },
  modalTitle: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
  },
  row: { flexDirection: "row", marginVertical: 5 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#000",
    color: COLORS.textMain,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#222",
  },
  gameGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  gameChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "#333",
    marginRight: 8,
    marginBottom: 10,
  },
  gameChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  gameChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  confirmBtnText: { color: "#000", fontWeight: "900", fontSize: 16 },
  cancelText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 20,
    fontWeight: "bold",
  },
  emptyText: { color: "#444", textAlign: "center", marginTop: 50 },
});
