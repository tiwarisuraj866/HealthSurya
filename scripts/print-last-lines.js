const fs = require('fs');

const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\6cd011ca-5f1a-4112-bb53-6a57a7bffb77\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log("No log file found at", logPath);
  process.exit(0);
}

const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
console.log(`Total lines: ${lines.length}. Showing last 20 lines:`);
const lastLines = lines.slice(-20);
lastLines.forEach((line, idx) => {
  console.log(`--- Line ${lines.length - 20 + idx} ---`);
  try {
    const obj = JSON.parse(line);
    console.log(JSON.stringify(obj, null, 2).slice(0, 1500));
  } catch (e) {
    console.log("Failed to parse line:", line.slice(0, 500));
  }
});
