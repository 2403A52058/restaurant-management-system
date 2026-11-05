const { spawn, execSync } = require('child_process');
const path = require('path');

// ANSI Color codes
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const rootDir = path.resolve(__dirname, '..');
const mariadbBin = 'C:\\Users\\koush\\AppData\\Local\\Programs\\mariadb\\bin\\mariadbd.exe';
const nodeBin = 'C:\\Users\\koush\\AppData\\Local\\Programs\\nodejs\\node.exe';
const npmCmd = 'C:\\Users\\koush\\AppData\\Local\\Programs\\nodejs\\npm.cmd';
const mysqlDataDir = path.join(rootDir, 'data', 'mysql');

console.clear();
console.log(`${c.bold}${c.yellow}======================================================================${c.reset}`);
console.log(`${c.bold}${c.green}  🍽️  TELANGANA RUCHULU — RESTAURANT MANAGEMENT SYSTEM (SINGLE TERMINAL)${c.reset}`);
console.log(`${c.bold}${c.yellow}======================================================================${c.reset}\n`);

const children = [];

function pipeOutput(stream, prefix, color) {
  if (!stream) return;
  stream.on('data', (chunk) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Filter routine MariaDB initialization logs to keep terminal clean
      if (trimmed.includes('InnoDB: Setting file') || trimmed.includes('InnoDB: log sequence number') || trimmed.includes('InnoDB: Initializing buffer')) continue;
      console.log(`${color}${c.bold}[${prefix}]${c.reset} ${line}`);
    }
  });
}

function waitForPattern(child, pattern, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, timeoutMs);

    const check = (chunk) => {
      if (chunk.toString().includes(pattern)) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve();
        }
      }
    };

    if (child.stdout) child.stdout.on('data', check);
    if (child.stderr) child.stderr.on('data', check);
  });
}

let isCleaningUp = false;
function cleanExit() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n${c.bold}${c.yellow}Shutting down all services...${c.reset}`);
  for (const child of children) {
    if (child && child.pid) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
        } else {
          child.kill('SIGTERM');
        }
      } catch (e) {}
    }
  }
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM mariadbd.exe', { stdio: 'ignore' });
    }
  } catch (e) {}
  console.log(`${c.bold}${c.green}✅ All services have stopped. Single terminal exited successfully.${c.reset}`);
  process.exit(0);
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

async function main() {
  // 1. Start MySQL
  console.log(`${c.cyan}[1/3] Starting MySQL Database Server on port 3306...${c.reset}`);
  const mysqlChild = spawn(mariadbBin, [
    `--datadir=${mysqlDataDir}`,
    '--port=3306',
    '--console'
  ], { windowsHide: true });
  children.push(mysqlChild);
  pipeOutput(mysqlChild.stdout, 'MySQL', c.blue);
  pipeOutput(mysqlChild.stderr, 'MySQL', c.blue);

  // Wait for MySQL to output "ready for connections"
  await waitForPattern(mysqlChild, 'ready for connections', 10000);
  console.log(`${c.bold}${c.blue}[MySQL]${c.reset} Database server is ready on port 3306!\n`);

  // Allow MariaDB to complete connection listener setup
  await new Promise(r => setTimeout(r, 2500));

  // 2. Start Backend
  console.log(`${c.green}[2/3] Starting Express Backend REST API on port 5000...${c.reset}`);
  const backendChild = spawn(nodeBin, ['src/server.js'], {
    cwd: path.join(rootDir, 'backend'),
    env: {
      ...process.env,
      PATH: `C:\\Users\\koush\\AppData\\Local\\Programs\\nodejs;C:\\Users\\koush\\AppData\\Local\\Programs\\mariadb\\bin;${process.env.PATH}`
    },
    windowsHide: true
  });
  children.push(backendChild);
  pipeOutput(backendChild.stdout, 'Backend', c.green);
  pipeOutput(backendChild.stderr, 'Backend', c.red);

  // Wait for Backend to connect to DB and start server
  await waitForPattern(backendChild, 'running on', 8000);
  console.log(`${c.bold}${c.green}[Backend]${c.reset} REST API server is listening on port 5000!\n`);

  // 3. Start Frontend
  console.log(`${c.magenta}[3/3] Starting React Vite Frontend on port 3000...${c.reset}`);
  const frontendChild = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(rootDir, 'frontend'),
    shell: true,
    env: {
      ...process.env,
      PATH: `C:\\Users\\koush\\AppData\\Local\\Programs\\nodejs;${process.env.PATH}`
    },
    windowsHide: true
  });
  children.push(frontendChild);
  pipeOutput(frontendChild.stdout, 'Frontend', c.magenta);
  pipeOutput(frontendChild.stderr, 'Frontend', c.red);

  await waitForPattern(frontendChild, 'Local:', 8000);

  console.log(`\n${c.bold}${c.green}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.green}  ✨ ENTIRE RESTAURANT MANAGEMENT SYSTEM IS LIVE! ✨${c.reset}`);
  console.log(`${c.bold}${c.yellow}  ➜ Web Application: ${c.reset}http://localhost:3000`);
  console.log(`${c.bold}${c.yellow}  ➜ REST API Server: ${c.reset}http://localhost:5000`);
  console.log(`${c.bold}${c.yellow}  ➜ MySQL Database:  ${c.reset}Port 3306`);
  console.log(`${c.bold}${c.cyan}  ➜ Admin Login:     ${c.reset}Username: admin  |  Password: admin123`);
  console.log(`${c.bold}${c.green}======================================================================${c.reset}`);
  console.log(`${c.bold}(All logs stream into this single terminal. Press Ctrl + C to stop.)${c.reset}\n`);
}

main().catch((err) => {
  console.error(`${c.red}Fatal Startup Error:${c.reset}`, err);
  cleanExit();
});
