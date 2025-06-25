const { GoogleSheetsService } = require("../src/services/googleSheets");
const { loadConfig } = require("../src/utils/config");
const { logger } = require("../src/utils/logger");

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

    // Validate each sheet configuration
    for (const sheetConfig of config) {
      try {
        logger.info(`\n--- Validating: ${sheetConfig.name} ---`);

        const validation = await sheetsService.validateSheetConfig(
          sheetConfig.sheetId,
          sheetConfig.sheetName
        );

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
          // Test reading the specified cells
          try {
            const currentSupplies = await sheetsService.getCellValue(
              sheetConfig.sheetId,
              sheetConfig.currentSuppliesCell,
              sheetConfig.sheetName
            );

            const dailyConsumption = await sheetsService.getCellValue(
              sheetConfig.sheetId,
              sheetConfig.dailyConsumptionCell,
              sheetConfig.sheetName
            );

            logger.info(
              `Current supplies (${sheetConfig.currentSuppliesCell}): ${currentSupplies}`
            );
            logger.info(
              `Daily consumption (${sheetConfig.dailyConsumptionCell}): ${dailyConsumption}`
            );
            logger.info(`✅ Cell data retrieved successfully`);
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
