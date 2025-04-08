/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const { logToConsoleWithBulk } = require('./consoleLogTest')

/**
 * Simulate log entries to test the bulk logging process to console.
 */
const simulateStressTestLogging = async () => {
  console.log('Starting stress test for console log simulation...')

  const TOTAL_LOGS = 100 // Total number of logs to simulate
  const LOG_INTERVAL = 1 // Interval (ms) between logs

  for (let i = 1; i <= TOTAL_LOGS; i++) {
    logToConsoleWithBulk(`Stress Test Log ${i}`)
    if (i % 1000 === 0) {
      console.log(`Logged ${i} messages...`)
    }

    // Use setImmediate instead of delay to avoid blocking
    await new Promise((resolve) => setImmediate(resolve))
  }

  console.log('Stress test completed. Awaiting any pending flush...')
}

simulateStressTestLogging()
