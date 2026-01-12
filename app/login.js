import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, API_BASE } from "../api/config";
import { COLORS, SIZES } from "../styles/theme";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = `${API_BASE}/auth`;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      // 1. Sign in with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (authError) throw authError;

      if (authData.user) {
        const response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabase_id: authData.user.id,
            email: authData.user.email, // ✅ Added this for the fallback logic
          }),
        });

        const profileData = await response.json();

        if (response.ok) {
          router.replace("/");
        } else {
          Alert.alert("Login Error", profileData.message);
        }
      }
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>DEALER'S CHOICE</Text>
        <Text style={styles.subtitle}>Enter the Arena</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>
              New player?{" "}
              <Text style={styles.linkHighlight}>Register here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: "center", padding: SIZES.padding },
  title: {
    fontSize: 32,
    color: COLORS.primary,
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: 4,
  },
  subtitle: {
    color: COLORS.textDim,
    textAlign: "center",
    marginBottom: 40,
    fontSize: 14,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.textMain,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  footer: { marginTop: 25 },
  linkText: { color: COLORS.textDim, textAlign: "center" },
  linkHighlight: { color: COLORS.primary, fontWeight: "bold" },
});
