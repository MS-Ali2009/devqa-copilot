#!/usr/bin/env node

/**
 * DevQA Copilot CLI Executable
 */
const { spawn } = require('child_process');
const path = require('path');

const cliTs = path.resolve(__dirname, '../src/cli/index.ts');
const tsxCli = require.resolve('tsx/cli');

const child = spawn(process.execPath, [tsxCli, cliTs, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
