import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const PRESENCE_CHANNEL = "presence";

export const getPresenceChannel = () =>
  supabase.channel(PRESENCE_CHANNEL) as RealtimeChannel;