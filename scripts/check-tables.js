const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found at', envPath);
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TABLES_TO_CHECK = [
  'profiles',
  'doctors',
  'labs',
  'pharmacy_medicines',
  'bookings',
  'medicine_orders',
  'audit_logs',
  'kyc_documents',
  'verification_requests',
  'tickets',
  'ticket_messages',
  'ai_conversations',
  'profile_completion',
  'trust_scores'
];

async function run() {
  console.log("Checking tables on Supabase:", supabaseUrl);
  console.log("-----------------------------------------");

  for (const table of TABLES_TO_CHECK) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table [${table}]: failed. Error: ${error.message}`);
      } else {
        console.log(`✅ Table [${table}]: accessible (exists). Row count: ${count}`);
      }
    } catch (err) {
      console.log(`❌ Table [${table}]: threw error: ${err.message}`);
    }
  }
}

run();
