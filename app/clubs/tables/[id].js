import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import io from "socket.io-client";
import { useAuth } from "../../../context/auth";
import * as Haptics from "expo-haptics";

// REUSABLE COMPONENTS
import Seat from "../../../components/poker/Seat";
import ActionButtons from "../../../components/poker/ActionButtons";
import CommunityCards from "../../../components/poker/CommunityCards";
import HandHistory from "../../../components/poker/HandHistory";
import DealerMessage from "../../../components/poker/DealerMessage";
import BuyInModal from "../../../components/poker/BuyInModal";
import SettingsModal from "../../../components/poker/SettingsModal";
import ShowdownOverlay from "../../../components/poker/ShowdownOverlay";
import { COLORS, SPACING, RADIUS } from "../../../styles/theme";
import { playSound } from "../../../utils/audioManager";

const { width } = Dimensions.get("window");

export default function PokerTable() {
  const { profile } = useAuth();
  const { id: tableId } = useLocalSearchParams();
  const router = useRouter();
  const socketRef = useRef(null);

  // --- 1. STATE MANAGEMENT ---
  const [tableData, setTableData] = useState({
    players: Array(10).fill(null),
    dealerIndex: null,
    activeGame: null,
    gameInProgress: false,
    communityCards: [],
    pot: 0,
    actingIndex: null,
    currentBet: 0,
    currentStreet: "PREFLOP",
    lastMessage: "CONNECTING...",
    clubId: null,
    supportedGameTypes: [],
  });

  const [settings, setSettings] = useState({
    soundEnabled: true,
    hapticsEnabled: true,
    autoMuck: false,
  });

  // Discard System State
  const [isDiscardMode, setIsDiscardMode] = useState(false);
  const [discardSelection, setDiscardSelection] = useState([]);
  const [discardRequirement, setDiscardRequirement] = useState({
    count: 0,
    type: "EXACT",
  });

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [buyInModalVisible, setBuyInModalVisible] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState("200");
  const [myHand, setMyHand] = useState([]);
  const [winners, setWinners] = useState([]);
  const [history, setHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [topUpVisible, setTopUpVisible] = useState(false);

  // --- 2. DYNAMIC CONFIGURATION HELPERS ---
  const supportedGames = tableData.supportedGameTypes || [];
  const isMultiGame = supportedGames.length > 1;

  const getGameDisplayInfo = (code) => {
    const mapping = {
      NLH: { name: "Hold'em", cards: 2 },
      PLO: { name: "Omaha", cards: 4 },
      PLO5: { name: "5-Card PLO", cards: 5 },
      PINE: { name: "Pineapple", cards: 3 },
      SHORT: { name: "Short Deck", cards: 2 },
      DRAW: { name: "5-Card Draw", cards: 5 },
    };
    return mapping[code] || { name: code, cards: "?" };
  };

  const userClubBalance = useMemo(() => {
    if (!profile?.Gems || !tableData.clubId) return 0;
    const entry = profile.Gems.find(
      (g) => g.clubId.toString() === tableData.clubId.toString(),
    );
    return entry ? entry.balance : 0;
  }, [profile, tableData.clubId]);

  const seatPositions = [
    { top: "82%", left: "50%" },
    { top: "75%", left: "15%" },
    { top: "55%", left: "5%" },
    { top: "35%", left: "5%" },
    { top: "15%", left: "25%" },
    { top: "15%", left: "75%" },
    { top: "35%", left: "95%" },
    { top: "55%", left: "95%" },
    { top: "75%", left: "85%" },
    { top: "82%", left: "72%" },
  ];

  const myPlayer = useMemo(
    () => tableData.players.find((p) => p?.userId === profile?.supabase_id),
    [tableData.players, profile?.supabase_id],
  );

  const isMeTheDealer =
    tableData.dealerIndex !== null &&
    tableData.players[tableData.dealerIndex]?.userId === profile?.supabase_id;

  // --- 3. SOCKET LOGIC ---
  useEffect(() => {
    // Replace with your actual server URL or environment variable
    socketRef.current = io(`http://192.168.1.94:3000`, {
      transports: ["websocket"],
      query: { userId: profile?.supabase_id },
    });
    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("joinTable", { tableId, userId: profile?.supabase_id });
    });

    socket.on("tableStateUpdate", (updatedTable) => {
      setTableData((prev) => ({ ...prev, ...updatedTable }));

      if (updatedTable.lastMessage) {
        setHistory((prev) => {
          if (prev[0] === updatedTable.lastMessage) return prev;
          return [updatedTable.lastMessage, ...prev].slice(0, 50);
        });
      }

      if (!updatedTable.gameInProgress) {
        setMyHand([]);
        setIsDiscardMode(false);
        setDiscardSelection([]);
        setTimeout(() => setWinners([]), 5000);
      }

      if (
        updatedTable.currentStreet === "SHOWDOWN" &&
        updatedTable.lastWinners
      ) {
        setWinners(updatedTable.lastWinners);
        if (settings.hapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    });

    socket.on("privateHand", (cards) => {
      setMyHand(cards);
      setDiscardSelection([]); // Clear selections when new cards arrive
    });

    socket.on("requestDiscard", ({ count, type }) => {
      setIsDiscardMode(true);
      setDiscardRequirement({ count, type: type || "EXACT" });
      setDiscardSelection([]);
      if (settings.hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    });

    socket.on("discardSuccess", () => {
      setIsDiscardMode(false);
      setDiscardSelection([]);
    });

    socket.on("error", (msg) => {
      Alert.alert("Table Error", msg);
      setBuyInModalVisible(false);
    });

    socket.on("gameTypeChanged", ({ gameType, dealerName }) => {
      if (settings.soundEnabled) playSound("shuffle");
    });

    return () => {
      socket.emit("leaveTable", { tableId });
      socket.disconnect();
    };
  }, [
    tableId,
    settings.hapticsEnabled,
    settings.soundEnabled,
    profile?.supabase_id,
  ]);

  // --- 4. HANDLERS ---
  const handleToggleCardSelection = useCallback(
    (cardIndex) => {
      if (!isDiscardMode) return;

      setDiscardSelection((prev) => {
        const isSelected = prev.includes(cardIndex);
        if (isSelected) {
          return prev.filter((i) => i !== cardIndex);
        } else {
          // Validation logic for MAX/EXACT
          if (
            discardRequirement.type !== "ANY" &&
            prev.length >= discardRequirement.count
          ) {
            return prev;
          }
          if (settings.hapticsEnabled) Haptics.selectionAsync();
          return [...prev, cardIndex];
        }
      });
    },
    [isDiscardMode, discardRequirement, settings.hapticsEnabled],
  );

  const handleConfirmDiscard = () => {
    if (
      discardRequirement.type === "EXACT" &&
      discardSelection.length !== discardRequirement.count
    ) {
      return Alert.alert(
        "Error",
        `Select exactly ${discardRequirement.count} cards.`,
      );
    }

    socketRef.current.emit("discardCards", {
      tableId,
      indices: discardSelection,
    });
  };

  const handleSeatPress = (index) => {
    if (tableData.players[index] || myPlayer) return;
    setSelectedSeat(index);
    setBuyInModalVisible(true);
  };

  const confirmSitDown = () => {
    const amount = parseInt(buyInAmount);
    if (isNaN(amount) || amount <= 0) return Alert.alert("Invalid Amount");
    if (userClubBalance < amount) return Alert.alert("Insufficient Gems");

    socketRef.current.emit("sitDown", {
      tableId,
      seatIndex: selectedSeat,
      buyIn: amount,
    });
    setBuyInModalVisible(false);
  };

  const handleStandUp = () => {
    Alert.alert("Stand Up", "Are you sure you want to leave your seat?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          socketRef.current.emit("standUp", { tableId });
        },
      },
    ]);
  };

  const currentChips = myPlayer?.chips || 0;
  const maxPossibleTopUp = (tableData?.maxBuyIn || 0) - currentChips;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADERBAR */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconBtnText}>❮</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setIsHistoryVisible(true)}
            style={styles.iconBtn}
          >
            <Text style={styles.iconBtnText}>📋</Text>
          </TouchableOpacity>

          {myPlayer && (
            <TouchableOpacity style={styles.standBtn} onPress={handleStandUp}>
              <Text style={styles.standBtnText}>STAND</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setTopUpVisible(true)}
            style={styles.topUpBtn}
          >
            <Text style={styles.topUpText}>+ CHIPS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={styles.iconBtn}
          >
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GAME AREA */}
      <View style={styles.tableArea}>
        <View style={styles.tableBoundary}>
          <View style={styles.felt}>
            <DealerMessage message={tableData?.lastMessage} />

            <View style={styles.centerInfo}>
              <CommunityCards
                cards={tableData.communityCards}
                pot={tableData.pot}
                activeGame={tableData.activeGame}
              />
            </View>

            {seatPositions.map((pos, index) => {
              const winnerData = winners.find((w) => w.seatIndex === index);
              const isMe = myPlayer?.seatIndex === index;
              return (
                <Seat
                  key={index}
                  index={index}
                  pos={pos}
                  player={tableData.players[index]}
                  isDealer={tableData.dealerIndex === index}
                  isActing={tableData.actingIndex === index}
                  onPress={() => handleSeatPress(index)}
                  myHand={isMe ? myHand : null}
                  currentStreet={tableData.currentStreet}
                  isWinner={!!winnerData}
                  winType={winnerData?.handName}
                  activeGame={tableData.activeGame}
                  isDiscarding={isMe && isDiscardMode}
                  selectedCards={isMe ? discardSelection : []}
                  onToggleCardSelection={handleToggleCardSelection}
                />
              );
            })}
          </View>
        </View>

        <ShowdownOverlay winners={winners} />

        <ActionButtons
          tableData={tableData}
          myPlayer={myPlayer}
          socket={socketRef.current}
          settings={settings}
          isDiscardMode={isDiscardMode}
          discardSelection={discardSelection}
          onConfirmDiscard={handleConfirmDiscard}
          onAction={(type, amount) => {
            socketRef.current.emit("playerAction", {
              tableId,
              actionType: type,
              amount,
            });
          }}
        />

        {/* DEALER CHOICE OVERLAY */}
        {isMeTheDealer && !tableData.gameInProgress && isMultiGame && (
          <View style={styles.dealerChoiceOverlay}>
            <View style={styles.dealerChoiceHeader}>
              <Text style={styles.choiceTitle}>DEALER'S CHOICE</Text>
            </View>
            <View style={styles.choiceRow}>
              {supportedGames.map((gameCode) => {
                const info = getGameDisplayInfo(gameCode);
                return (
                  <TouchableOpacity
                    key={gameCode}
                    onPress={() => {
                      socketRef.current.emit("setGameType", {
                        tableId,
                        gameType: gameCode,
                      });
                    }}
                    style={[
                      styles.gameBtn,
                      tableData.activeGame === gameCode && styles.activeGameBtn,
                    ]}
                  >
                    <Text style={styles.gameBtnType}>{gameCode}</Text>
                    <Text style={styles.gameBtnDesc}>{info.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* MODALS */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        settings={settings}
        updateSettings={(k, v) => setSettings((s) => ({ ...s, [k]: v }))}
      />

      <BuyInModal
        visible={topUpVisible}
        onClose={() => setTopUpVisible(false)}
        onConfirm={(amt) => {
          socketRef.current.emit("topUp", { tableId, amount: parseInt(amt) });
          setTopUpVisible(false);
        }}
        tableMin={1}
        tableMax={Math.min(userClubBalance, maxPossibleTopUp)}
        userBalance={userClubBalance}
        title="TOP UP"
      />

      <HandHistory
        visible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
        history={history}
      />

      <Modal visible={buyInModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.buyInBox}>
            <Text style={styles.modalTitle}>
              SIT AT SEAT {selectedSeat + 1}
            </Text>
            <Text style={styles.balanceText}>
              Available: {userClubBalance} Gems
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={buyInAmount}
              onChangeText={setBuyInAmount}
              placeholder="Amount"
              placeholderTextColor="#444"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setBuyInModalVisible(false)}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSitDown}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmText}>BUY IN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: "#111",
    zIndex: 10,
  },
  headerActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 10 },
  iconBtnText: { color: "#FFF", fontSize: 18 },
  standBtn: {
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  standBtnText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  topUpBtn: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  topUpText: { color: "#000", fontSize: 10, fontWeight: "bold" },
  tableArea: { flex: 1, justifyContent: "center" },
  tableBoundary: {
    width: width * 0.98,
    aspectRatio: 0.7,
    backgroundColor: "#2e1d12",
    borderRadius: 200,
    padding: 8,
    alignSelf: "center",
    borderWidth: 4,
    borderColor: "#1a100a",
  },
  felt: {
    flex: 1,
    backgroundColor: "#143d14",
    borderRadius: 190,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  centerInfo: { position: "absolute", zIndex: 1 },
  dealerChoiceOverlay: {
    position: "absolute",
    top: "25%",
    width: "85%",
    backgroundColor: "rgba(0,0,0,0.95)",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: "center",
    zIndex: 200,
  },
  choiceTitle: {
    color: COLORS.primary,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 15,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  gameBtn: {
    backgroundColor: "#222",
    padding: 10,
    margin: 5,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  activeGameBtn: { borderColor: COLORS.primary, borderWidth: 1 },
  gameBtnType: { color: COLORS.primary, fontWeight: "bold" },
  gameBtnDesc: { color: "#888", fontSize: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  buyInBox: {
    backgroundColor: "#1A1A1A",
    padding: 25,
    borderRadius: 15,
    width: "80%",
  },
  modalTitle: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 5,
  },
  balanceText: {
    color: COLORS.primary,
    textAlign: "center",
    fontSize: 12,
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelText: { color: "#666" },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  confirmText: { color: "#000", fontWeight: "bold" },
});
