import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE, supabase } from "../../api/config";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";
import { useSocket } from "../../context/SocketContext";
import BuyInModal from "../../components/BuyInModal";

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

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const [tableName, setTableName] = useState("");
  const [sb, setSb] = useState("1");
  const [bb, setBb] = useState("2");
  const [selectedGames, setSelectedGames] = useState(["NLH"]);
  const [minBuyIn, setMinBuyIn] = useState("40");
  const [maxBuyIn, setMaxBuyIn] = useState("200");

  const [buyInVisible, setBuyInVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [userClubBalance, setUserClubBalance] = useState(0);

  const dotOpacity = useRef(new Animated.Value(1)).current;

  // --- 1. Fetching Logic ---
  const fetchTables = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // FIXED: Route matches clubRoutes.js -> router.get("/:clubId/tables", ...)
      const tableRes = await fetch(`${API_BASE}/clubs/${clubId}/tables`);
      const tableData = await tableRes.json();
      setTables(Array.isArray(tableData) ? tableData : []);

      const clubRes = await fetch(`${API_BASE}/clubs/${clubId}`);
      const clubData = await clubRes.json();

      if (clubData?.members) {
        const me = clubData.members.find(
          (m) =>
            m.userId.toString() === user.id.toString() ||
            m.supabase_id === user.id,
        );
        if (me && (me.role === "owner" || me.role === "manager")) {
          setIsStaff(true);
        }
      }
      if (clubData && clubData.owner_supabase_id === user.id) {
        setIsOwner(true);
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

  // --- 2. Action Handlers ---
  const handleTableClick = async (table) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // FIXED: Route matches clubRoutes.js -> router.get("/:clubId/balance/:supabase_id", ...)
      const response = await fetch(
        `${API_BASE}/clubs/${clubId}/balance/${user.id}`,
      );
      const data = await response.json();

      setUserClubBalance(data.balance || 0);
      setSelectedTable(table);
      setBuyInVisible(true);
    } catch (error) {
      Alert.alert("Error", "Could not fetch your club balance.");
    }
  };

  const handleFinalSitDown = (amount) => {
    setBuyInVisible(false);
    router.push({
      pathname: `/clubs/tables/${selectedTable._id}`,
      params: { buyInAmount: amount },
    });
  };

  const handleCreateTable = async () => {
    if (!tableName || !minBuyIn || !maxBuyIn)
      return Alert.alert("Required", "Please fill in all table parameters.");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    try {
      // FIXED: Route matches clubRoutes.js -> router.post("/:clubId/tables/create", ...)
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
            user_supabase_id: user.id,
          }),
        },
      );

      if (response.ok) {
        setCreateModalVisible(false);
        setTableName("");
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
    const isGameActive = item.gameInProgress || activePlayers >= 2;

    return (
      <TouchableOpacity
        style={styles.tableCard}
        onPress={() => handleTableClick(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tableNameContainer}>
            {isGameActive && (
              <Animated.View
                style={[styles.liveDot, { opacity: dotOpacity }]}
              />
            )}
            <Text style={styles.tableName}>{item.name}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ID: {item._id?.slice(-4)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.blindsText}>
            Stakes: ${item.blinds?.small || item.sb}/$
            {item.blinds?.big || item.bb}
          </Text>
          <Text style={styles.buyinRangeText}>
            Buy-in: ${item.minBuyIn} - ${item.maxBuyIn}
          </Text>
        </View>

        <View style={styles.gameTags}>
          {item.allowedGames?.map((g) => (
            <View key={g} style={styles.tag}>
              <Text style={styles.tagText}>{g}</Text>
            </View>
          ))}
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>❮ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CLUB LOBBY</Text>
        {isStaff ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.createBtnText}>+ TABLE</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
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
            <Text style={styles.emptyText}>
              No active tables. Create one below!
            </Text>
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

      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>CONFIGURE TABLE</Text>
            <Text style={styles.label}>Table Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. High Stakes"
              placeholderTextColor="#444"
              value={tableName}
              onChangeText={setTableName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Small Blind</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={sb}
                  onChangeText={setSb}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Big Blind</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={bb}
                  onChangeText={setBb}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Min Buy-in ($)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={minBuyIn}
                  onChangeText={setMinBuyIn}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Max Buy-in ($)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={maxBuyIn}
                  onChangeText={setMaxBuyIn}
                />
              </View>
            </View>

            <Text style={styles.label}>Allowed Games Pool</Text>
            <View style={styles.gameGrid}>
              {GAME_VARIATIONS.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={[
                    styles.gameChip,
                    selectedGames.includes(game.id) && styles.gameChipActive,
                  ]}
                  onPress={() => toggleGame(game.id)}
                >
                  <Text
                    style={[
                      styles.gameChipText,
                      selectedGames.includes(game.id) && { color: "#000" },
                    ]}
                  >
                    {game.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleCreateTable}
            >
              <Text style={styles.confirmBtnText}>OPEN TABLE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backBtnText: { color: COLORS.textSecondary, fontWeight: "bold" },
  headerTitle: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  createBtnText: { color: "#000", fontWeight: "bold" },
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
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  tableNameContainer: { flexDirection: "row", alignItems: "center" },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  tableName: { color: COLORS.textMain, fontSize: 20, fontWeight: "bold" },
  badge: {
    backgroundColor: "#222",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeText: { color: COLORS.textSecondary, fontSize: 10 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  blindsText: { color: "#AAA", fontSize: 13 },
  buyinRangeText: { color: COLORS.primary, fontSize: 12, fontWeight: "bold" },
  gameTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.md,
  },
  tag: {
    backgroundColor: "#333",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: { color: COLORS.primary, fontSize: 10, fontWeight: "bold" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: SPACING.sm,
  },
  playerCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
  },
  joinAction: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
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
