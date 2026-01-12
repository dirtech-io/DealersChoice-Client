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
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import io from "socket.io-client";
import { useAuth } from "../../../context/auth";

// REUSABLE COMPONENTS
import Seat from "../../../components/poker/Seat";
import ActionButtons from "../../../components/poker/ActionButtons";
import CommunityCards from "../../../components/poker/CommunityCards";
import { COLORS, SPACING, RADIUS } from "../../../styles/theme";
import { globalStyles } from "../../../styles/global";

const { width, height } = Dimensions.get("window");
const TABLE_WIDTH = width * 0.85;
const TABLE_HEIGHT = height * 0.6;

let socket;

export default function PokerTable() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();

  // 1. Table State (Source of Truth from Server)
  const [tableData, setTableData] = useState({
    players: Array(10).fill(null),
    dealerIndex: null,
    activeGame: null,
    gameInProgress: false,
    communityCards: [],
    pot: 0,
    actingIndex: null,
    currentBet: 0,
  });

  // 2. Local UI State (Managed at the page level)
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [buyInModalVisible, setBuyInModalVisible] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState("200");
  const [myHand, setMyHand] = useState([]);

  const [reBuyVisible, setReBuyVisible] = useState(false);
  const [reBuyAmount, setReBuyAmount] = useState("200");

  // 3. Derived State
  const myPlayer = tableData.players.find((p) => p?.userId === user?.id);
  const isMeTheDealer =
    tableData.dealerIndex !== null &&
    tableData.players[tableData.dealerIndex]?.userId === user?.id;

  const seatPositions = [
    { bottom: "2%", alignSelf: "center" },
    { bottom: "12%", left: "-12%" },
    { bottom: "35%", left: "-18%" },
    { top: "30%", left: "-18%" },
    { top: "10%", left: "-8%" },
    { top: "2%", alignSelf: "center" },
    { top: "10%", right: "-8%" },
    { top: "30%", right: "-18%" },
    { bottom: "35%", right: "-18%" },
    { bottom: "12%", right: "-12%" },
  ];

  useEffect(() => {
    socket = io(`http://192.168.1.94:3000`, { transports: ["websocket"] });

    if (socket) {
      socket.on("connect", () => {
        socket.emit("joinTable", { tableId: id, userId: user?.id });
      });

      socket.on("tableStateUpdate", (updatedTable) => {
        setTableData({ ...updatedTable });
        if (!updatedTable.gameInProgress) setMyHand([]);
      });

      socket.on("privateHand", (cards) => setMyHand(cards));

      socket.on("error", (msg) => {
        Alert.alert("Error", msg);
        setBuyInModalVisible(false);
      });
    }

    return () => {
      if (socket) {
        socket.off("tableStateUpdate");
        socket.off("privateHand");
        socket.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    if (myPlayer && myPlayer.chips <= 0 && !tableData.gameInProgress) {
      setReBuyVisible(true);
    } else {
      setReBuyVisible(false);
    }
  }, [myPlayer?.chips, tableData.gameInProgress]);

  const handleSeatPress = (index) => {
    if (tableData.players[index]) return;
    setSelectedSeat(index);
    setBuyInModalVisible(true);
  };

  const confirmSitDown = () => {
    if (!user) return Alert.alert("Error", "Logged out.");
    socket.emit("sitDown", {
      tableId: id,
      seatIndex: selectedSeat,
      userId: user.id,
      buyIn: parseInt(buyInAmount),
    });
    setBuyInModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableArea}>
        <View style={styles.tableBoundary}>
          <View style={styles.felt}>
            <DealerMessage message={tableData.lastMessage} />
            <CommunityCards
              cards={tableData.communityCards}
              pot={tableData.pot}
            />
            <CommunityCards
              cards={tableData.communityCards}
              pot={tableData.pot}
              activeGame={tableData.activeGame}
            />
            {tableData.currentStreet === "SHOWDOWN" && (
              <ShowdownOverlay winners={tableData.lastWinners} />
            )}

            {seatPositions.map((pos, index) => (
              <Seat
                key={index}
                index={index}
                pos={pos}
                player={tableData.players[index]}
                isDealer={tableData.dealerIndex === index}
                isActing={tableData.actingIndex === index}
                onPress={() => handleSeatPress(index)}
                myHand={myPlayer?.seatIndex === index ? myHand : null}
              />
            ))}
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
      {/* BUY-IN MODAL */}
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

      {/* RE-BUY MODAL */}
      <Modal visible={reBuyVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.buyInBox}>
            <Text style={styles.modalTitle}>YOU'RE BUSTED!</Text>
            <Text
              style={{ color: "#aaa", textAlign: "center", marginBottom: 10 }}
            >
              Add chips to keep your seat
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={reBuyAmount}
              onChangeText={setReBuyAmount}
            />
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                socket.emit("reBuy", {
                  tableId: id,
                  userId: user.id,
                  amount: parseInt(reBuyAmount),
                });
                setReBuyVisible(false);
              }}
            >
              <Text style={styles.confirmText}>RE-BUY & CONTINUE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginTop: 15, alignItems: "center" }}
            >
              <Text style={{ color: "#ff4d4d", fontWeight: "bold" }}>
                LEAVE TABLE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tableArea: {
    flex: 1,
    ...globalStyles.centered,
  },
  tableBoundary: {
    width: TABLE_WIDTH,
    height: TABLE_HEIGHT,
    backgroundColor: COLORS.wood,
    borderRadius: 150, // Keep specific for table shape
    padding: SPACING.sm,
    elevation: 20,
  },
  felt: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.felt,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: COLORS.feltBorder,
    ...globalStyles.centered,
  },
  dealerChoiceOverlay: {
    position: "absolute",
    backgroundColor: COLORS.overlay,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  choiceTitle: {
    color: COLORS.primaryDark,
    fontWeight: "bold",
    marginBottom: SPACING.md,
  },
  choiceRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  gameBtn: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#555",
    marginHorizontal: SPACING.xs,
  },
  gameBtnText: {
    color: COLORS.textMain,
    fontWeight: "600",
  },
  modalOverlay: {
    ...globalStyles.modalOverlay,
  },
  buyInBox: {
    ...globalStyles.modalBox,
    width: 280,
  },
  modalTitle: {
    color: COLORS.textMain,
    fontWeight: "bold",
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#111",
    color: COLORS.textMain,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: "bold",
  },
  confirmBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  confirmText: {
    color: COLORS.textMain,
    fontWeight: "bold",
  },
});
