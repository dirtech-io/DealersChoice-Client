import { useEffect } from "react";
import { Stack, useRouter, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../context/auth";
import { SafeAreaProvider } from "react-native-safe-area-context";

// 1. Import the font hooks and specific weights
import { useFonts, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import { Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";

// Keep the splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    GoldFont: Cinzel_700Bold,
    InterRegular: Inter_400Regular,
    InterBold: Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Once fonts are ready (or if there's an error), hide the splash screen
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Prevent rendering until fonts are ready to avoid "Black Screen" or flashes
  if (!fontsLoaded && !fontError) {
    return null;
  }

  function AuthGate() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // If we've finished checking auth and there is no user, send them to login
      if (!loading && !user) {
        router.replace("/login");
      }
    }, [user, loading]);

    // While checking auth, you might want to show a splash screen or null
    if (loading) return null;

    return <Slot />;
  }
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
