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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE, supabase } from "../../api/config";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";
import { globalStyles } from "../../styles/global";
import { useSocket } from "../../context/SocketContext";

// Define the "Dealer's Choice" options
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

  // Table Configuration State
  const [tableName, setTableName] = useState("");
  const [sb, setSb] = useState("1");
  const [bb, setBb] = useState("2");
  const [selectedGames, setSelectedGames] = useState(["NLH"]);

  // Animation for the "Live" dot
  const dotOpacity = useRef(new Animated.Value(1)).current;

  // Start pulsing animation on mount
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 0.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const fetchTables = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Fetch tables via REST (Initial Load)
      const tableRes = await fetch(`${API_BASE}/club/tables/${clubId}`);
      const tableData = await tableRes.json();
      setTables(tableData);

      // 2. Fetch club details to check ownership/staff status
      const clubRes = await fetch(`${API_BASE}/clubs/${clubId}`);
      const clubData = await clubRes.json();

      if (clubData?.members) {
        const me = clubData.members.find(
          (m) => m.userId.toString() === user.id.toString(),
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

    // Join the specific Club Lobby Room via Socket for live updates
    socket.emit("joinClubLobby", { clubId });

    // Listen for Live Updates (Player counts, new tables, etc.)
    socket.on("clubTablesUpdate", (updatedTables) => {
      setTables(updatedTables);
    });

    return () => {
      socket.off("clubTablesUpdate");
      socket.emit("leaveClubLobby", { clubId });
    };
  }, [clubId, socket]);

  const toggleGame = (id) => {
    if (selectedGames.includes(id)) {
      if (selectedGames.length > 1) {
        setSelectedGames(selectedGames.filter((g) => g !== id));
      }
    } else {
      setSelectedGames([...selectedGames, id]);
    }
  };

  const handleCreateTable = async () => {
    if (!tableName) return Alert.alert("Required", "Please name the table.");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    try {
      const response = await fetch(`${API_BASE}/club/tables/${clubId}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tableName,
          sb: parseInt(sb),
          bb: parseInt(bb),
          allowedGames: selectedGames,
          user_supabase_id: user.id,
        }),
      });

      if (response.ok) {
        setCreateModalVisible(false);
        setTableName("");
        // Note: The socket broadcast from the server will update the list for us.
      } else {
        const result = await response.json();
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to server.");
    }
  };

  const renderTableItem = ({ item }) => {
    const activePlayers = item.players?.filter((p) => p !== null).length || 0;
    const isGameActive = item.gameInProgress || activePlayers >= 2;

    return (
      <TouchableOpacity
        style={styles.tableCard}
        onPress={() => router.push(`/clubs/tables/${item._id}`)}
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

        <Text style={styles.blindsText}>
          Stakes: ${item.blinds?.small || item.sb}/$
          {item.blinds?.big || item.bb}
        </Text>

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
        {isOwner || isStaff ? (
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
          keyExtractor={(item) => item._id}
          renderItem={renderTableItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No active tables. Create one below!
            </Text>
          }
        />
      )}

      {/* CREATE TABLE MODAL */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CONFIGURE TABLE</Text>

            <TextInput
              style={styles.input}
              placeholder="Table Name (e.g. High Stakes)"
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

            <Text style={styles.label}>
              Allowed Games (Dealer's Choice Pool)
            </Text>
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backBtnText: {
    color: COLORS.textSecondary,
    fontWeight: "bold",
  },
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
  createBtnText: {
    color: "#000",
    fontWeight: "bold",
  },
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
  tableNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 8,
    shadowColor: "#4CAF50",
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  tableName: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: "#222",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  blindsText: {
    color: "#AAA",
    fontSize: 14,
    marginBottom: SPACING.md,
  },
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
  tagText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
  },
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
  modalOverlay: {
    ...globalStyles.modalOverlay,
    padding: SPACING.lg,
  },
  modalContent: {
    ...globalStyles.modalBox,
    width: "100%",
    padding: 25,
  },
  modalTitle: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    marginVertical: 10,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: "#000",
    color: COLORS.textMain,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#222",
  },
  gameGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
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
  confirmBtnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
  cancelText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 20,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#444",
    textAlign: "center",
    marginTop: 50,
  },
});
