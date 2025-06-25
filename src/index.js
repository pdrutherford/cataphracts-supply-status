// Load environment variables from .env file
require("dotenv").config();

const { GoogleSheetsService } = require("./services/googleSheets");
const { DiscordNotifier } = require("./services/discord");
const { loadConfig } = require("./utils/config");
const { logger } = require("./utils/logger");

/**
 * Parse a numeric value that may contain commas as thousands separators
 * @param {string|number} value - The value to parse
 * @returns {number} - The parsed numeric value
 */
function parseNumericValue(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error(
      `Invalid value type: expected string or number, got ${typeof value}`
    );
  }

  // Remove commas and parse as float
  const cleanedValue = value.replace(/,/g, "");
  const parsed = parseFloat(cleanedValue);

  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric value: "${value}"`);
  }

  return parsed;
}

async function main() {
  try {
    logger.info("Starting supply status monitor...");

    // Load configuration
    const config = await loadConfig();
    logger.info(`Loaded configuration for ${config.length} sheets`);

    // Initialize services
    const sheetsService = new GoogleSheetsService();
    const discordNotifier = new DiscordNotifier();

    // Process each sheet configuration
    for (const sheetConfig of config) {
      try {
        logger.info(`Processing sheet: ${sheetConfig.name}`);

        // Get data from Google Sheets
        const currentSupplies = await sheetsService.getCellValue(
          sheetConfig.sheetId,
          sheetConfig.currentSuppliesCell
        );

        const dailyConsumption = await sheetsService.getCellValue(
          sheetConfig.sheetId,
          sheetConfig.dailyConsumptionCell
        );

        // Calculate new supply value after daily consumption
        const currentSuppliesFloat = parseNumericValue(currentSupplies);
        const dailyConsumptionFloat = parseNumericValue(dailyConsumption);

        if (isNaN(currentSuppliesFloat) || isNaN(dailyConsumptionFloat)) {
          throw new Error(
            "Invalid supply or consumption values - must be numbers"
          );
        }

        if (dailyConsumptionFloat <= 0) {
          throw new Error("Daily consumption must be greater than 0");
        }

        const newSupplyValue = Math.max(
          0,
          currentSuppliesFloat - dailyConsumptionFloat
        );

        // Check if supplies are already at zero or will hit zero
        const suppliesWereZero = currentSuppliesFloat === 0;
        const suppliesHitZero =
          currentSuppliesFloat > 0 && newSupplyValue === 0;

        logger.info(
          `${sheetConfig.name}: Current supplies: ${currentSuppliesFloat}, Daily consumption: ${dailyConsumptionFloat}, New supply value: ${newSupplyValue}`
        );

        // Only update the sheet if supplies weren't already at zero
        if (!suppliesWereZero) {
          // Update the current supplies in the Google Sheet
          await sheetsService.updateCellValue(
            sheetConfig.sheetId,
            sheetConfig.currentSuppliesCell,
            newSupplyValue
          );

          logger.info(
            `Updated ${sheetConfig.name} current supplies from ${currentSuppliesFloat} to ${newSupplyValue}`
          );
        } else {
          logger.info(
            `${sheetConfig.name} supplies were already at zero - no update needed`
          );
        }

        // Send appropriate Discord notification based on supply status
        if (suppliesWereZero || suppliesHitZero) {
          await discordNotifier.sendZeroSupplies({
            name: sheetConfig.name,
            suppliesWereAlreadyZero: suppliesWereZero,
            dailyConsumption: dailyConsumptionFloat,
            webhookUrl: sheetConfig.webhookUrl,
          });
        } else {
          // Calculate days remaining based on the new supply value
          const daysRemaining = calculateDaysRemaining(
            newSupplyValue,
            dailyConsumptionFloat
          );

          // Send normal Discord notification
          await discordNotifier.sendSupplyStatus({
            name: sheetConfig.name,
            currentSupplies: newSupplyValue,
            dailyConsumption: dailyConsumptionFloat,
            daysRemaining,
            webhookUrl: sheetConfig.webhookUrl,
          });
        }

        logger.info(
          `Successfully processed ${sheetConfig.name}: ${
            suppliesWereZero || suppliesHitZero
              ? "supplies are at zero"
              : `${calculateDaysRemaining(
                  newSupplyValue,
                  dailyConsumptionFloat
                )} days remaining`
          }`
        );
      } catch (error) {
        logger.error(`Error processing sheet ${sheetConfig.name}:`, error);

        // Send error notification to Discord
        try {
          await discordNotifier.sendError({
            sheetName: sheetConfig.name,
            error: error.message,
            webhookUrl: sheetConfig.webhookUrl,
          });
        } catch (notifyError) {
          logger.error("Failed to send error notification:", notifyError);
        }
      }
    }

    logger.info("Supply status monitor completed successfully");
  } catch (error) {
    logger.error("Fatal error in supply status monitor:", error);
    process.exit(1);
  }
}

function calculateDaysRemaining(currentSupplies, dailyConsumption) {
  const current = parseNumericValue(currentSupplies);
  const daily = parseNumericValue(dailyConsumption);

  if (daily <= 0) {
    throw new Error("Daily consumption must be greater than 0");
  }

  return Math.floor(current / daily);
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    logger.error("Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = { main, calculateDaysRemaining };
