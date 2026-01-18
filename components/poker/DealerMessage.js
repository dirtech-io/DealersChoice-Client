import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../styles/theme";

export default function DealerMessage({ message }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      // Fade in when a message arrives
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out when cleared
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [message]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.dealerIcon}>
          <Text style={styles.iconText}>D</Text>
        </View>
        <Text style={styles.text} numberOfLines={1}>
          {message?.toUpperCase() || ""}
        </Text>
      </Animated.View>
      {!message && <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    marginVertical: SPACING.xs,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dealerIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  spacer: {
    height: 20,
  },
  text: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
