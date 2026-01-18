import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API_BASE } from "../../../../api/config";
import { COLORS, SPACING, RADIUS } from "../../../../styles/theme";

export default function ClubAuditLog() {
  const { id: clubId } = useLocalSearchParams();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [clubId]);

  const fetchLogs = async () => {
    try {
      // Ensure your backend endpoint is querying the "club_table_transactions" collection
      const response = await fetch(`${API_BASE}/clubs/${clubId}/transactions`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const renderLogItem = ({ item }) => {
    // Mapping colors based on your SIT_DOWN / STAND_UP / TOP_UP types
    const isReturningToWallet = item.type === "STAND_UP";

    return (
      <View style={styles.logCard}>
        <View style={styles.logMain}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.details}>
            {item.type.replace("_", " ")} • {item.tableName}
          </Text>
          <Text style={styles.date}>
            {new Date(item.timestamp).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              { color: isReturningToWallet ? "#4CAF50" : "#FF5252" },
            ]}
          >
            {isReturningToWallet ? "+" : "-"}
            {item.amount}
          </Text>
          <Text style={styles.gemLabel}>GEMS</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TABLE ACTIVITY LOG</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderLogItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No table transactions found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    paddingTop: 50,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 10,
    letterSpacing: 1,
  },
  listContent: {
    padding: SPACING.md,
  },
  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  logMain: {
    flex: 1,
  },
  username: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  details: {
    color: "#888",
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
  },
  date: {
    color: "#555",
    fontSize: 10,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontWeight: "900",
    fontSize: 18,
  },
  gemLabel: {
    color: "#444",
    fontSize: 9,
    fontWeight: "bold",
  },
  emptyState: {
    marginTop: 100,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});
