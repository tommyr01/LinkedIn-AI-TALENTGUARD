#!/usr/bin/env node
/**
 * Worker startup script for BullMQ job processing
 * This script starts all background workers for the TalentGuard Buyer Intelligence platform
 */

require('dotenv').config({ path: '.env.local' });
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting TalentGuard Buyer Intelligence Workers...\n');

// Worker configurations
const workers = [
  {
    name: 'Research Worker',
    script: path.join(__dirname, '..', 'src', 'workers', 'research-worker.ts'),
    description: 'Handles AI-powered company research and news generation',
  },
  {
    name: 'Enrichment Worker', 
    script: path.join(__dirname, '..', 'src', 'workers', 'enrichment-worker.ts'),
    description: 'Enriches contact data from LinkedIn and email services',
  },
  {
    name: 'Report Worker',
    script: path.join(__dirname, '..', 'src', 'workers', 'report-worker.ts'),
    description: 'Generates automated reports and analytics',
  }
];

const runningWorkers = [];

// Function to start a worker
function startWorker(worker) {
  console.log(`📋 Starting ${worker.name}...`);
  console.log(`   ${worker.description}`);
  
  const childProcess = spawn('npx', ['tsx', worker.script], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });
  
  // Handle worker output
  childProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      console.log(`[${worker.name}] ${message}`);
    }
  });
  
  childProcess.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      console.error(`[${worker.name}] ERROR: ${error}`);
    }
  });
  
  // Handle worker exit
  childProcess.on('exit', (code, signal) => {
    console.log(`\n⚠️  ${worker.name} exited with code ${code} (signal: ${signal})`);
    
    if (code !== 0 && !signal) {
      console.log(`🔄 Restarting ${worker.name} in 5 seconds...`);
      setTimeout(() => {
        if (!shuttingDown) {
          startWorker(worker);
        }
      }, 5000);
    }
  });
  
  // Handle worker errors
  childProcess.on('error', (err) => {
    console.error(`\n❌ Failed to start ${worker.name}:`, err.message);
  });
  
  runningWorkers.push({
    name: worker.name,
    process: childProcess,
    pid: childProcess.pid
  });
  
  console.log(`✅ ${worker.name} started (PID: ${childProcess.pid})\n`);
}

// Start all workers
console.log('🔧 Redis Configuration:');
console.log(`   Host: ${process.env.REDIS_HOST || 'localhost'}`);
console.log(`   Port: ${process.env.REDIS_PORT || '6379'}`);
console.log(`   Password: ${process.env.REDIS_PASSWORD ? '***' : 'none'}\n`);

console.log('🎯 Starting workers...\n');

workers.forEach(worker => {
  startWorker(worker);
});

console.log(`🎉 All ${workers.length} workers started successfully!\n`);

// Display status information
function displayStatus() {
  console.log('📊 Worker Status:');
  runningWorkers.forEach(worker => {
    console.log(`   ${worker.name}: Running (PID: ${worker.pid})`);
  });
  console.log('\n💡 Available queues: research, enrichment, reports, signals');
  console.log('🌐 Monitor queues at: http://localhost:3000/api/jobs');
  console.log('📖 Queue docs: http://localhost:3000/api/queues/research?includeJobs=true\n');
}

displayStatus();

// Graceful shutdown handling
let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  
  shuttingDown = true;
  console.log('\n🛑 Shutting down workers...');
  
  const shutdownPromises = runningWorkers.map(worker => {
    return new Promise((resolve) => {
      console.log(`   Stopping ${worker.name} (PID: ${worker.pid})...`);
      
      worker.process.kill('SIGINT');
      
      worker.process.on('exit', () => {
        console.log(`   ✅ ${worker.name} stopped`);
        resolve();
      });
      
      // Force kill after 10 seconds
      setTimeout(() => {
        if (!worker.process.killed) {
          console.log(`   ⚡ Force killing ${worker.name}...`);
          worker.process.kill('SIGKILL');
        }
        resolve();
      }, 10000);
    });
  });
  
  Promise.all(shutdownPromises).then(() => {
    console.log('\n🏁 All workers stopped. Goodbye!');
    process.exit(0);
  });
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Keep the process running
process.stdin.resume();