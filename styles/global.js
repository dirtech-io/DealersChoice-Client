import { StyleSheet } from "react-native";
import { COLORS, RADIUS } from "./theme";

export const globalStyles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: 280,
    backgroundColor: "#222",
    padding: 20,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  baseText: {
    color: COLORS.textMain,
    fontSize: 14,
  },
});
