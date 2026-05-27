import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tuyekzfqxvznndhwdkth.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1eWVremZxeHZ6bm5kaHdka3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NjQ5MTYsImV4cCI6MjA5NTQ0MDkxNn0.G2EemB5ECkYYkKA6hnccRsRw8dVSs93oBynROg0J0jc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
