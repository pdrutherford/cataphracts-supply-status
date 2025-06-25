const https = require('https');
const { logger } = require('../utils/logger');

class DiscordNotifier {
  
  async sendSupplyStatus({ name, currentSupplies, dailyConsumption, daysRemaining, webhookUrl }) {
    const color = this.getStatusColor(daysRemaining);
    const statusEmoji = this.getStatusEmoji(daysRemaining);
    
    const embed = {
      title: `${statusEmoji} Supply Status: ${name}`,
      color: color,
      fields: [
        {
          name: "📦 Current Supplies",
          value: `${currentSupplies}`,
          inline: true
        },
        {
          name: "📉 Daily Consumption",
          value: `${dailyConsumption}`,
          inline: true
        },
        {
          name: "⏰ Days Remaining",
          value: `${daysRemaining} days`,
          inline: true
        }
      ],
      footer: {
        text: `Supply Status Monitor • ${new Date().toISOString().split('T')[0]}`
      },
      timestamp: new Date().toISOString()
    };
    
    const payload = {
      embeds: [embed]
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
      color: 0xFF0000, // Red
      fields: [
        {
          name: "Sheet",
          value: sheetName,
          inline: true
        },
        {
          name: "Error",
          value: error,
          inline: false
        }
      ],
      footer: {
        text: `Supply Status Monitor • ${new Date().toISOString().split('T')[0]}`
      },
      timestamp: new Date().toISOString()
    };
    
    const payload = {
      content: "🚨 **ERROR**: Failed to process supply status",
      embeds: [embed]
    };
    
    await this.sendWebhook(webhookUrl, payload);
    logger.info(`Sent error notification for ${sheetName}`);
  }
  
  getStatusColor(daysRemaining) {
    if (daysRemaining <= 3) {
      return 0xFF0000; // Red - Critical
    } else if (daysRemaining <= 7) {
      return 0xFF8C00; // Orange - Warning
    } else if (daysRemaining <= 14) {
      return 0xFFFF00; // Yellow - Caution
    } else {
      return 0x00FF00; // Green - Good
    }
  }
  
  getStatusEmoji(daysRemaining) {
    if (daysRemaining <= 3) {
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'User-Agent': 'Supply-Status-Monitor/1.0'
        }
      };
      
      const req = https.request(options, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseBody);
          } else {
            reject(new Error(`Discord webhook failed with status ${res.statusCode}: ${responseBody}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Discord webhook request failed: ${error.message}`));
      });
      
      req.write(data);
      req.end();
    });
  }
}

module.exports = { DiscordNotifier };
