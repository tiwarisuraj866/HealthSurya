const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
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

const profiles = [
  {
    id: "f1000001-0001-4000-8000-000000000001",
    clerk_user_id: "f1000001-0001-4000-8000-000000000001",
    phone: "9876500501",
    email: "admin@healthsurya.com",
    full_name: "Suraj Tiwari (Admin)",
    role: "admin",
    verification_status: "approved",
    is_active: true
  },
  {
    id: "c1000001-0001-4000-8000-000000000001",
    clerk_user_id: "c1000001-0001-4000-8000-000000000001",
    phone: "9876500502",
    email: "doctor@healthsurya.com",
    full_name: "Dr. Rajesh Gupta",
    role: "doctor",
    verification_status: "approved",
    is_active: true
  },
  {
    id: "d1000001-0001-4000-8000-000000000001",
    clerk_user_id: "d1000001-0001-4000-8000-000000000001",
    phone: "9876500503",
    email: "lab@healthsurya.com",
    full_name: "PathCare Diagnostics",
    role: "lab",
    verification_status: "approved",
    is_active: true
  },
  {
    id: "d1000002-0001-4000-8000-000000000002",
    clerk_user_id: "d1000002-0001-4000-8000-000000000002",
    phone: "9876500504",
    email: "pharmacy@healthsurya.com",
    full_name: "MedLife Labs",
    role: "pharmacy",
    verification_status: "approved",
    is_active: true
  },
  {
    id: "b1000001-0001-4000-8000-000000000001",
    clerk_user_id: "b1000001-0001-4000-8000-000000000001",
    phone: "9876500505",
    email: "patient@healthsurya.com",
    full_name: "Rahul Sharma",
    role: "patient",
    verification_status: "approved",
    is_active: true
  }
];

async function run() {
  console.log("Seeding profiles...");
  for (const p of profiles) {
    const { data, error } = await supabase.from('profiles').upsert(p, { onConflict: 'id' });
    if (error) {
      console.error(`Failed to upsert profile ${p.email}:`, error.message);
    } else {
      console.log(`Upserted profile ${p.email}`);
    }
  }
  console.log("Seeding complete!");
}

run();
