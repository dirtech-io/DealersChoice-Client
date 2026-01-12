import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

// From your Supabase Project Settings > API
const supabaseUrl = "https://ntuahcvdbflitslyggpq.supabase.co";
const supabaseAnonKey = "sb_publishable_t9SRnxXxy_nXX-DaxBuKBw_MamwACGB";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Your existing Node.js server address
const COMPUTER_IP = "192.168.1.94";
export const API_BASE = `http://${COMPUTER_IP}:3000/api`;

export default {
  COMPUTER_IP,
  API_BASE,
};
