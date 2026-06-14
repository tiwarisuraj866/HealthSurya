const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\6cd011ca-5f1a-4112-bb53-6a57a7bffb77\\.system_generated\\logs\\transcript.jsonl';

const lines = fs.readFileSync(logPath, 'utf-8').split('\n');
console.log("Searching for console logs in subagent steps...");
console.log("-----------------------------------------------");

lines.forEach(line => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        if (tc.name === 'capture_browser_console_logs') {
          console.log(`Step ${obj.step_index}: capture_browser_console_logs`);
        }
      });
    }
    // Check if the response contains console log contents
    if (obj.content && obj.content.includes('"level"') && obj.content.includes('"text"')) {
      console.log(`Step ${obj.step_index} output snippet:`);
      console.log(obj.content.slice(0, 1000));
      console.log("-----------------------------------------------");
    }
  } catch (e) {
    // Ignore JSON parse error
  }
});
