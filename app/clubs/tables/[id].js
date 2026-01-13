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
import { COLORS, SPACING, RADIUS, SIZING } from "../../../styles/theme";
import { globalStyles } from "../../../styles/global";
import DealerMessage from "../../../components/poker/DealerMessage";

const { width, height } = Dimensions.get("window");

let socket;

export default function PokerTable() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 1. Table State
  const [tableData, setTableData] = useState({
    players: Array(10).fill(null),
    dealerIndex: null,
    activeGame: null,
    gameInProgress: false,
    communityCards: [],
    pot: 0,
    actingIndex: null,
    currentBet: 0,
    lastMessage: "DEALER'S CHOICE",
  });

  // 2. Local UI State
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [buyInModalVisible, setBuyInModalVisible] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState("200");
  const [myHand, setMyHand] = useState([]);
  const [reBuyVisible, setReBuyVisible] = useState(false);
  const [reBuyAmount, setReBuyAmount] = useState("200");

  // Optimized Vertical Seat Positions
  const seatPositions = [
    { top: "85%", left: "50%" }, // Seat 0: Bottom Center (Hero)
    { top: "78%", left: "18%" }, // Seat 1: Bottom Left
    { top: "58%", left: "8%" }, // Seat 2: Mid Left
    { top: "38%", left: "8%" }, // Seat 3: Top Left
    { top: "18%", left: "25%" }, // Seat 4: Top Corner Left
    { top: "18%", left: "75%" }, // Seat 5: Top Corner Right
    { top: "38%", left: "92%" }, // Seat 6: Top Right
    { top: "58%", left: "92%" }, // Seat 7: Mid Right
    { top: "78%", left: "82%" }, // Seat 8: Bottom Right
    { top: "85%", left: "72%" }, // Seat 9: Bottom Right (Adjacent to Hero)
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
      setTableData((prev) => ({ ...prev, ...updatedTable }));
      if (!updatedTable.gameInProgress) setMyHand([]);
      if (
        updatedTable.currentStreet === "SHOWDOWN" &&
        updatedTable.lastWinners
      ) {
        // This triggers the animations in our Seat components
        setWinners(updatedTable.lastWinners);

        // Auto-reset the UI after 5 seconds to prepare for the next hand
        setTimeout(() => {
          setWinners([]);
        }, 5000);
      }
    });

    socket.on("privateHand", (cards) => setMyHand(cards));

    socket.on("error", (msg) => {
      Alert.alert("Error", msg);
      setBuyInModalVisible(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const handleSeatPress = (index) => {
    if (tableData.players[index] || myPlayer) return;
    setSelectedSeat(index);
    setBuyInModalVisible(true);
  };

  const confirmSitDown = () => {
    socket.emit("sitDown", {
      tableId: id,
      seatIndex: selectedSeat,
      userId: user.id,
      buyIn: parseInt(buyInAmount),
    });
    setBuyInModalVisible(false);
  };

  const [winners, setWinners] = useState([]);

  useEffect(() => {
    // Listen for the showdown/winner event
    socket.on("handOver", (data) => {
      // data.winners usually contains an array of seatIndexes and their hand names
      setWinners(data.winners);

      // Clear winners after 5 seconds to reset animations
      setTimeout(() => {
        setWinners([]);
      }, 5000);
    });

    return () => socket.off("handOver");
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.leaveText}>Leave</Text>
        </TouchableOpacity>
        <Text style={styles.tableTitle}>Table #{id?.slice(-4)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tableArea}>
        {/* THE VISUAL TABLE BOUNDARY */}
        <View style={styles.tableBoundary}>
          <View style={styles.felt}>
            <DealerMessage message={tableData?.lastMessage} />

            {/* CENTER INFO AREA */}
            <View style={styles.centerInfo}>
              <CommunityCards
                cards={tableData.communityCards}
                pot={tableData.pot}
                activeGame={tableData.activeGame}
              />
            </View>

            {/* SEATS - Positioned absolutely inside the felt */}

            {seatPositions.map((pos, index) => {
              const isWinner = winners.some((w) => w.seatIndex === index);
              const winType = winners.find(
                (w) => w.seatIndex === index
              )?.handName;
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
                isWinner={isWinner}
                winType={winType}
              />;
            })}
          </View>
        </View>

        {/* Action Buttons: Visible only during your turn */}
        {tableData.actingIndex === myPlayer?.seatIndex && (
          <ActionButtons
            tableData={tableData}
            myPlayer={myPlayer}
            onAction={(type, amount) => {
              socket.emit("playerAction", {
                tableId: id,
                actionType: type,
                amount,
              });
            }}
          />
        )}

        {/* Dealer Choice Menu */}
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

      {/* MODALS remain the same... */}
      <Modal visible={buyInModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.buyInBox}>
            <Text style={styles.modalTitle}>
              SIT AT SEAT {selectedSeat + 1}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={buyInAmount}
              onChangeText={setBuyInAmount}
              autoFocus
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.md,
    alignItems: "center",
  },
  leaveText: { color: COLORS.textSecondary, fontWeight: "bold" },
  tableTitle: { color: COLORS.primary, fontWeight: "bold", letterSpacing: 1 },
  tableArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tableBoundary: {
    width: width * 0.95,
    aspectRatio: 0.65,
    backgroundColor: COLORS.wood || "#3d2b1f",
    borderRadius: 200,
    padding: 10,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  felt: {
    flex: 1,
    backgroundColor: COLORS.felt || "#1a4a1a",
    borderRadius: 190,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative", // Critical for absolute Seat positioning
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
    borderWidth: 1,
    borderColor: "#444",
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
    borderWidth: 1,
    borderColor: "#444",
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
    fontWeight: "bold",
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
});
