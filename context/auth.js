import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase, API_BASE } from "../api/config";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // MongoDB Profile
  const [loading, setLoading] = useState(true);

  // Function to fetch MongoDB profile data
  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching MongoDB profile:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Optimistic UI Update:
   * Updates a specific club balance in the local state immediately
   * after a table buy-in or top-up.
   */
  const updateClubBalance = (clubId, amountToSubtract) => {
    if (!profile || !profile.gems) return;

    const updatedGems = profile.gems.map((gem) => {
      if (gem.clubId === clubId) {
        // Handle both Decimal128 objects and standard numbers
        const currentBalance = gem.balance?.$numberDecimal
          ? parseFloat(gem.balance.$numberDecimal)
          : parseFloat(gem.balance);

        const newBalance = currentBalance - amountToSubtract;

        return {
          ...gem,
          balance: gem.balance?.$numberDecimal
            ? { ...gem.balance, $numberDecimal: newBalance.toString() }
            : newBalance,
        };
      }
      return gem;
    });

    setProfile({ ...profile, gems: updatedGems });
  };

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for Auth Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = () => {
    if (user) fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshProfile,
        updateClubBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
