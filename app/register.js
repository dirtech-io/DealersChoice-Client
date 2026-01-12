import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, API_BASE } from "../api/config";
import { COLORS, SIZES } from "../styles/theme";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [inviteCode, setInviteCode] = useState(""); // Re-added invite code state
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !username || !inviteCode) {
      Alert.alert("Error", "All fields, including Invite Code, are required");
      return;
    }

    setLoading(true);

    try {
      // STEP 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // STEP 2: Sync with Node server AND process the Invite Code
        const syncResponse = await fetch(`${API_BASE}/auth/sync-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabase_id: authData.user.id,
            email: email,
            username: username,
            inviteCode: inviteCode.trim().toUpperCase(), // Normalize the code
          }),
        });

        const syncData = await syncResponse.json();

        if (syncResponse.ok) {
          Alert.alert(
            "Welcome!",
            `Account created and joined ${syncData.clubName || "your club"}!`
          );
          router.replace("/login");
        } else {
          // If profile sync fails (e.g. invalid invite code), we should warn the user
          throw new Error(syncData.message || "Failed to sync profile");
        }
      }
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>JOIN THE GAME</Text>

        <TextInput
          style={styles.input}
          placeholder="Invite Code (e.g. GOLD777)"
          placeholderTextColor="#666"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>CREATE ACCOUNT & JOIN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.linkText}>Already a member? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    padding: SIZES.padding,
    justifyContent: "center",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "bold",
    letterSpacing: 2,
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
  linkText: { color: COLORS.textDim, textAlign: "center", marginTop: 20 },
});
