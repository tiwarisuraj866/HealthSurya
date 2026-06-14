const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const targets = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
  'INTERNAL_API_SECRET',
  'NEXT_PUBLIC_PREVIEW_LISTINGS'
];

async function run() {
  console.log("Setting environment variables on Vercel...");
  
  for (const key of targets) {
    const value = env[key];
    if (value === undefined) {
      console.log(`Skipping ${key} (not defined in .env.local)`);
      continue;
    }

    console.log(`Setting ${key} on Vercel...`);
    
    // First remove if exists (ignore error if it doesn't exist)
    try {
      execSync(`npx.cmd vercel env rm ${key} production -y`, { stdio: 'ignore' });
    } catch (e) {
      // ignore
    }

    // Add value
    try {
      execSync(`npx.cmd vercel env add ${key} production`, { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
      console.log(`Successfully set ${key}`);
    } catch (e) {
      console.error(`Error setting ${key}:`, e.message);
    }
  }

  console.log("Environment variables sync complete!");
}

run();
