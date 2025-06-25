// Load environment variables from .env file
require("dotenv").config();

const { GoogleSheetsService } = require("../src/services/googleSheets");
const { loadConfig } = require("../src/utils/config");
const { logger } = require("../src/utils/logger");

/**
 * Sleep for the specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff for quota errors
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isQuotaError =
        error.message.includes("Quota exceeded") ||
        error.message.includes("quota metric");

      if (isQuotaError && i < maxRetries) {
        const delay = baseDelay * Math.pow(2, i);
        logger.warn(
          `Quota exceeded, retrying in ${delay}ms... (attempt ${i + 1}/${
            maxRetries + 1
          })`
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}

/**
 * Validation script to check sheet configurations
 * Run with: node scripts/validate-sheets.js
 */
async function validateSheets() {
  try {
    logger.info("Starting sheet configuration validation...");

    // Load configuration
    const config = await loadConfig();
    logger.info(`Loaded configuration for ${config.length} sheets`);

    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService();

    logger.info(`⚡ Using optimized batch processing to reduce API calls`);
    logger.info(
      `📊 Processing ${config.length} sheets with enhanced rate limiting`
    );

    // Validate each sheet configuration with optimized rate limiting
    for (let i = 0; i < config.length; i++) {
      const sheetConfig = config[i];

      try {
        logger.info(
          `\n--- Validating: ${sheetConfig.name} (${i + 1}/${
            config.length
          }) ---`
        );

        // Add delay between requests to avoid hitting rate limits
        // Increased delay for better quota management
        if (i > 0) {
          logger.info("⏱️  Waiting 5 seconds to avoid rate limits...");
          await sleep(5000);
        }

        const validation = await retryWithBackoff(
          async () => {
            return await sheetsService.validateSheetConfig(
              sheetConfig.sheetId,
              sheetConfig.sheetName
            );
          },
          4,
          2000
        ); // Increased retries and base delay

        logger.info(`Spreadsheet: "${validation.spreadsheetTitle}"`);
        logger.info(`Total sheets: ${validation.totalSheets}`);
        logger.info(
          `Available sheets: ${validation.availableSheets.join(", ")}`
        );
        logger.info(`Target sheet: ${validation.targetSheet || "N/A"}`);
        logger.info(
          `Status: ${validation.isValid ? "✅ VALID" : "❌ INVALID"}`
        );
        logger.info(`Message: ${validation.message}`);

        if (validation.isValid) {
          // Test reading the specified cells using batch API to reduce calls
          try {
            logger.info("📖 Reading cell values using batch API...");

            const cellValues = await retryWithBackoff(
              async () => {
                return await sheetsService.getCellValuesBatch(
                  sheetConfig.sheetId,
                  [
                    sheetConfig.currentSuppliesCell,
                    sheetConfig.dailyConsumptionCell,
                  ],
                  sheetConfig.sheetName
                );
              },
              4,
              2000
            ); // Increased retries and base delay

            const currentSupplies = cellValues[sheetConfig.currentSuppliesCell];
            const dailyConsumption =
              cellValues[sheetConfig.dailyConsumptionCell];

            logger.info(
              `Current supplies (${sheetConfig.currentSuppliesCell}): ${
                currentSupplies || "No data"
              }`
            );
            logger.info(
              `Daily consumption (${sheetConfig.dailyConsumptionCell}): ${
                dailyConsumption || "No data"
              }`
            );
            logger.info(`✅ Cell data retrieved successfully using batch API`);
          } catch (cellError) {
            logger.error(`❌ Error reading cells: ${cellError.message}`);
          }
        }
      } catch (error) {
        logger.error(`❌ Error validating ${sheetConfig.name}:`, error.message);
      }
    }

    logger.info("\n🏁 Validation completed!");
  } catch (error) {
    logger.error("Fatal error during validation:", error);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateSheets().catch((error) => {
    logger.error("Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = { validateSheets };
