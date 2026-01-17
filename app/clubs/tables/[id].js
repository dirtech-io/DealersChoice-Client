import React, { useState, useEffect } from "react";
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

// REUSABLE COMPONENTS
import Seat from "../../../components/poker/Seat";
import ActionButtons from "../../../components/poker/ActionButtons";
import CommunityCards from "../../../components/poker/CommunityCards";
import HandHistory from "../../../components/poker/HandHistory"; // Don't forget to import this!
import DealerMessage from "../../../components/poker/DealerMessage";
import { COLORS, SPACING, RADIUS } from "../../../styles/theme";
import { globalStyles } from "../../../styles/global";

const { width, height } = Dimensions.get("window");

let socket;

export default function PokerTable() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();

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
    lastMessage: "DEALER'S CHOICE",
  });

  const [selectedSeat, setSelectedSeat] = useState(null);
  const [buyInModalVisible, setBuyInModalVisible] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState("200");
  const [myHand, setMyHand] = useState([]);
  const [winners, setWinners] = useState([]);
  const [history, setHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // Define seat positions inside the component or a constants file
  const seatPositions = [
    { top: "85%", left: "50%" },
    { top: "78%", left: "18%" },
    { top: "58%", left: "8%" },
    { top: "38%", left: "8%" },
    { top: "18%", left: "25%" },
    { top: "18%", left: "75%" },
    { top: "38%", left: "92%" },
    { top: "58%", left: "92%" },
    { top: "78%", left: "82%" },
    { top: "85%", left: "72%" },
  ];

  const myPlayer = tableData.players.find((p) => p?.userId === user?.id);
  const isMeTheDealer =
    tableData.dealerIndex !== null &&
    tableData.players[tableData.dealerIndex]?.userId === user?.id;

  useEffect(() => {
    socket = io(`http://192.168.1.94:3000`, { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("joinTable", { tableId: id, userId: user?.id });
    });

    socket.on("tableStateUpdate", (updatedTable) => {
      if (
        updatedTable.actingIndex !== null &&
        updatedTable.players[updatedTable.actingIndex]?.userId === user?.id &&
        tableData.actingIndex !== updatedTable.actingIndex // Only play if index actually changed
      ) {
        playSound("alert");
      }

      setTableData((prev) => ({ ...prev, ...updatedTable }));

      // 1. History Logic
      if (updatedTable.lastMessage) {
        setHistory((prev) => {
          if (prev[0] === updatedTable.lastMessage) return prev;
          return [updatedTable.lastMessage, ...prev].slice(0, 50);
        });
      }

      // 2. Clear visual states if game ended
      if (!updatedTable.gameInProgress) {
        setMyHand([]);
        setWinners([]);
      }

      // 3. Handle Showdown Winners
      if (
        updatedTable.currentStreet === "SHOWDOWN" &&
        updatedTable.lastWinners
      ) {
        setWinners(updatedTable.lastWinners);
      }
    });

    socket.on("privateHand", (cards) => setMyHand(cards));

    socket.on("error", (msg) => {
      Alert.alert("Error", msg);
      setBuyInModalVisible(false);
    });

    return () => {
      socket.off("tableStateUpdate");
      socket.off("privateHand");
      socket.off("error");
      socket.disconnect();
    };
  }, [id]);

  const handleSeatPress = (index) => {
    if (tableData.players[index] || myPlayer) return;
    setSelectedSeat(index);
    setBuyInModalVisible(true);
  };

  const confirmSitDown = () => {
    const amount = parseInt(buyInAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid buy-in amount.");
      return;
    }
    if (user?.balance < amount) {
      Alert.alert(
        "Insufficient Funds",
        `You only have $${user.balance}. Please buy more chips or enter a lower amount.`,
      );
      return;
    }
    socket.emit("sitDown", {
      tableId: id,
      seatIndex: selectedSeat,
      userId: user.id,
      buyIn: parseInt(buyInAmount),
    });
    setBuyInModalVisible(false);
  };

  const handleLeave = () => {
    Alert.alert(
      "Leave Table",
      "Are you sure you want to leave? Your chips will be returned to your wallet.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          onPress: () => {
            socket.emit("leaveTable", { tableId: id });
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave}>
          <Text style={styles.leaveText}>Leave</Text>
        </TouchableOpacity>

        <Text style={styles.tableTitle}>Table #{id?.slice(-4)}</Text>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => setIsHistoryVisible(true)}
        >
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

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
              return (
                <Seat
                  key={index}
                  index={index}
                  pos={pos}
                  player={tableData.players[index]}
                  isDealer={tableData.dealerIndex === index}
                  isActing={tableData.actingIndex === index}
                  onPress={() => handleSeatPress(index)}
                  myHand={myPlayer?.seatIndex === index ? myHand : null}
                  currentStreet={tableData.currentStreet}
                  socket={socket}
                  isWinner={!!winnerData}
                  winType={winnerData?.handName}
                />
              );
            })}
          </View>
        </View>

        <ActionButtons
          tableData={tableData}
          myPlayer={myPlayer}
          socket={socket}
          onAction={(type, amount) => {
            socket.emit("playerAction", {
              tableId: id,
              actionType: type,
              amount,
            });
          }}
        />

        {isMeTheDealer && !tableData.gameInProgress && (
          <View style={styles.dealerChoiceOverlay}>
            <Text style={styles.choiceTitle}>SELECT GAME</Text>
            <View style={styles.choiceRow}>
              {["Holdem", "PLO", "Pineapple"].map((game) => (
                <TouchableOpacity
                  key={game}
                  onPress={() =>
                    socket.emit("setGameType", { tableId: id, gameType: game })
                  }
                  style={styles.gameBtn}
                >
                  <Text style={styles.gameBtnText}>{game}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <HandHistory
        visible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
        history={history}
      />

      {/* Buy-in Modal (Simplified here for space, keep your original) */}
      <Modal visible={buyInModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.buyInBox}>
            <Text style={styles.modalTitle}>
              SIT AT SEAT {selectedSeat + 1}
            </Text>

            {/* Show available balance */}
            <Text style={styles.balanceText}>
              Available: ${user?.balance?.toLocaleString() || "0"}
            </Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={buyInAmount}
              onChangeText={setBuyInAmount}
              placeholder="Enter Amount"
              placeholderTextColor="#666"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setBuyInModalVisible(false)}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSitDown}
                style={[
                  styles.confirmBtn,
                  { opacity: parseInt(buyInAmount) > user?.balance ? 0.5 : 1 },
                ]}
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
  // ... (Keep your previous styles)
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.md,
    alignItems: "center",
  },
  leaveText: { color: COLORS.textSecondary, fontWeight: "bold" },
  tableTitle: { color: COLORS.primary, fontWeight: "bold", letterSpacing: 1 },
  historyBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  historyBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  tableArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  tableBoundary: {
    width: width * 0.95,
    aspectRatio: 0.65,
    backgroundColor: COLORS.wood || "#3d2b1f",
    borderRadius: 200,
    padding: 10,
  },
  felt: {
    flex: 1,
    backgroundColor: COLORS.felt || "#1a4a1a",
    borderRadius: 190,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  centerInfo: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  dealerChoiceOverlay: {
    position: "absolute",
    bottom: 100,
    backgroundColor: "rgba(0,0,0,0.9)",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  choiceTitle: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginBottom: SPACING.md,
  },
  choiceRow: { flexDirection: "row" },
  gameBtn: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: RADIUS.md,
    marginHorizontal: 5,
  },
  gameBtnText: { color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  buyInBox: {
    backgroundColor: "#222",
    padding: 25,
    borderRadius: 15,
    width: 300,
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#000",
    color: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  cancelText: { color: "#888", fontWeight: "bold" },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmText: { color: "#000", fontWeight: "bold" },
  balanceText: {
    color: "#aaa",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 10,
  },
  // Ensure your input text is visible
  input: {
    backgroundColor: "#000",
    color: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
});
