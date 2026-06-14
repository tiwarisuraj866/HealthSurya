const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    return;
  }

  const supabase = createClient(url, key, {
    db: {
      schema: 'auth'
    },
    auth: {
      persistSession: false
    }
  });

  console.log("Querying auth.audit_log_entries...");
  const { data: logs, error } = await supabase
    .from('audit_log_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error querying audit_log_entries:", error);
  } else {
    console.log("Recent Auth Audit Logs:");
    console.log(JSON.stringify(logs, null, 2));
  }
}

run();
