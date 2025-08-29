const https = require("https");
const { logger } = require("../utils/logger");
const { format } = require("date-fns");
const { formatInTimeZone } = require("date-fns-tz");

class DiscordNotifier {
  // Get current day in New York timezone
  getCurrentDayNY() {
    const now = new Date();
    return formatInTimeZone(now, "America/New_York", "EEEE, MMMM do");
  }

  // Calculate the date when supplies will reach zero
  getZeroSuppliesDate(daysRemaining) {
    const now = new Date();
    const zeroDate = new Date(
      now.getTime() + daysRemaining * 24 * 60 * 60 * 1000
    );
    return formatInTimeZone(zeroDate, "America/New_York", "EEEE, MMMM do");
  }

  async sendSupplyStatus({
    name,
    currentSupplies,
    dailyConsumption,
    daysRemaining,
    webhookUrl,
    sheetId,
  }) {
    const color = this.getStatusColor(daysRemaining);
    const statusEmoji = this.getStatusEmoji(daysRemaining);
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;

    // Format the concise message with clickable hyperlink
    const description = [
      `⚡ **Status:** ${name}`,
      `📅 ${this.getCurrentDayNY()} • [Open Sheet](${spreadsheetUrl})`,
      `📦 **Supplies** ${currentSupplies} • 📉 **Cons** ${dailyConsumption}/d • ⏰ **Days** ${daysRemaining}`,
      `🚨 **Zero Date** ${this.getZeroSuppliesDate(daysRemaining)}`,
    ].join("\n");

    const embed = {
      description: description,
      color: color,
      timestamp: new Date().toISOString(),
    };

    const payload = {
      embeds: [embed],
    };

    // Add an alert message if supplies are running low
    if (daysRemaining <= 3) {
      payload.content = `🚨 **URGENT**: ${name} supplies are critically low! Only ${daysRemaining} days remaining.`;
    } else if (daysRemaining <= 7) {
      payload.content = `⚠️ **WARNING**: ${name} supplies are running low. ${daysRemaining} days remaining.`;
    }

    await this.sendWebhook(webhookUrl, payload);
    logger.info(`Sent supply status notification for ${name}`);
  }

  async sendError({ sheetName, error, webhookUrl }) {
    const embed = {
      title: "❌ Supply Monitor Error",
      color: 0xff0000, // Red
      fields: [
        {
          name: "Sheet",
          value: sheetName,
          inline: true,
        },
        {
          name: "Error",
          value: error,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    const payload = {
      content: "🚨 **ERROR**: Failed to process supply status",
      embeds: [embed],
    };

    await this.sendWebhook(webhookUrl, payload);
    logger.info(`Sent error notification for ${sheetName}`);
  }

  async sendZeroSupplies({
    name,
    suppliesWereAlreadyZero,
    dailyConsumption,
    webhookUrl,
    sheetId,
  }) {
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;

    // Format the concise message with clickable hyperlink for zero supplies
    const description = [
      `⚡ **Status:** ${name}`,
      `📅 ${this.getCurrentDayNY()} • [Open Sheet](${spreadsheetUrl})`,
      `📦 **Supplies** 0 (OUT OF STOCK) • 📉 **Cons** ${dailyConsumption}/d • ⏰ **Days** 0`,
      `🚨 **Zero Date** TODAY - IMMEDIATE ACTION REQUIRED`,
      ``,
      `**${
        suppliesWereAlreadyZero
          ? "Supplies were already depleted"
          : "Supplies have just been depleted today"
      }**`,
    ].join("\n");

    const embed = {
      title: `🚨 ZERO SUPPLIES ALERT: ${name}`,
      description: description,
      color: 0x8b0000, // Dark red for critical situation
      timestamp: new Date().toISOString(),
    };

    const urgentMessage = suppliesWereAlreadyZero
      ? `🚨 **CRITICAL**: ${name} supplies are STILL at ZERO! No supplies available for consumption.`
      : `🚨 **CRITICAL**: ${name} supplies have reached ZERO today! Immediate restocking required.`;

    const payload = {
      content: urgentMessage,
      embeds: [embed],
    };

    await this.sendWebhook(webhookUrl, payload);
    logger.info(`Sent zero supplies alert for ${name}`);
  }

  getStatusColor(daysRemaining) {
    if (daysRemaining === 0) {
      return 0x8b0000; // Dark red - Zero supplies
    } else if (daysRemaining <= 3) {
      return 0xff0000; // Red - Critical
    } else if (daysRemaining <= 7) {
      return 0xff8c00; // Orange - Warning
    } else if (daysRemaining <= 14) {
      return 0xffff00; // Yellow - Caution
    } else {
      return 0x00ff00; // Green - Good
    }
  }

  getStatusEmoji(daysRemaining) {
    if (daysRemaining === 0) {
      return "🚨";
    } else if (daysRemaining <= 3) {
      return "🚨";
    } else if (daysRemaining <= 7) {
      return "⚠️";
    } else if (daysRemaining <= 14) {
      return "⚡";
    } else {
      return "✅";
    }
  }

  async sendWebhook(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);

      const url = new URL(webhookUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "User-Agent": "Supply-Status-Monitor/1.0",
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = "";

        res.on("data", (chunk) => {
          responseBody += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseBody);
          } else {
            reject(
              new Error(
                `Discord webhook failed with status ${res.statusCode}: ${responseBody}`
              )
            );
          }
        });
      });

      req.on("error", (error) => {
        reject(new Error(`Discord webhook request failed: ${error.message}`));
      });

      req.write(data);
      req.end();
    });
  }
}

module.exports = { DiscordNotifier };
