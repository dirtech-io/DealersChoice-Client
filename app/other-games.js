// app/other-games.js
import { View, Text } from "react-native";

export default function OtherGames() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white" }}>Other Games Coming Soon</Text>
    </View>
  );
}
