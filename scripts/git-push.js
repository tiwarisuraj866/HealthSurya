const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("Error: GITHUB_TOKEN environment variable is required.");
  process.exit(1);
}

async function run() {
  console.log("Starting push using isomorphic-git...");
  try {
    await git.push({
      fs,
      http,
      dir,
      url: 'https://github.com/tiwarisuraj866/HealthSurya.git',
      ref: 'main',
      force: true,
      onAuth: () => ({
        username: 'tiwarisuraj866',
        password: token
      })
    });
    console.log("Push successful!");
  } catch (error) {
    console.error("Push failed:", error);
    process.exit(1);
  }
}

run();
