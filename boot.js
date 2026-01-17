const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("Checking system health...");

// 1. Check Node Modules
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log("Dependencies missing. Installing (this may take a minute)...");
    try {
        execSync('npm install', { stdio: 'inherit', cwd: __dirname });
        console.log("Dependencies installed!");
    } catch (e) {
        console.error("Failed to install dependencies automatically.", e);
        process.exit(1);
    }
}

// 2. Start Server
console.log("Starting server...");
require('./server.js');
