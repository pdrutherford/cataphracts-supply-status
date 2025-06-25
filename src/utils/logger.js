const fs = require("fs");
const path = require("path");

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    // Detect if running in GitHub Actions
    this.isGitHubActions = process.env.GITHUB_ACTIONS === "true";
  }

  shouldLog(level) {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);

    let formattedMessage = `[${timestamp}] ${levelStr} ${message}`;

    if (args.length > 0) {
      // Handle error objects and other complex data
      const formattedArgs = args.map((arg) => {
        if (arg instanceof Error) {
          return `\n${arg.stack || arg.message}`;
        } else if (typeof arg === "object") {
          return `\n${JSON.stringify(arg, null, 2)}`;
        }
        return arg;
      });

      formattedMessage += ` ${formattedArgs.join(" ")}`;
    }

    return formattedMessage;
  }

  // Check if message contains sensitive supply data or operational intelligence
  containsSensitiveData(message, ...args) {
    const sensitivePatterns = [
      // Supply numbers and calculations
      /\b\d+\s*(supplies?|days?)\b/i,
      /\b(current|remaining|daily)\s*:\s*\d+/i,
      /\b\d+\s*(days?\s*)?(left|remaining)\b/i,
      /\bsupplies?\s*:\s*\d+/i,
      /\bconsumption\s*:\s*\d+/i,
      // Discord webhook URLs (contain tokens)
      /https:\/\/discord\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+/,
      // Google service account emails
      /[a-zA-Z0-9-]+@[a-zA-Z0-9-]+\.iam\.gserviceaccount\.com/,
      // Cell references with values in context of supplies
      /cell\s+[A-Z]+\d+.*\d+/i,
      // Operational intelligence about army status
      /supplies are (critically low|running low|still at zero)/i,
      /supplies have (reached zero|just been depleted)/i,
      /(urgent|critical|warning).*supplies/i,
      /immediate (action|restocking) required/i,
      /zero supplies (alert|date)/i,
      /days.{0,20}(remaining|left)/i,
      // More specific supply status patterns
      /supplies?\s+(are\s+)?(critically\s+)?low/i,
      /supplies?\s+(have\s+)?reached\s+zero/i,
      /out\s+of\s+supplies?/i,
      /supplies?\s+(exhausted|depleted)/i,
      /immediate\s+restocking/i,
      /critical\s+supply/i,
      /zero\s+supplies?/i,
      // Discord notification content patterns
      /sent.{0,20}(supply status|zero supplies|notification)/i,
    ];

    const fullText = message + " " + args.join(" ");
    return sensitivePatterns.some((pattern) => pattern.test(fullText));
  }

  writeLog(level, message, ...args) {
    if (this.isGitHubActions && this.containsSensitiveData(message, ...args)) {
      // In GitHub Actions, sanitize sensitive data but keep the context
      const sanitizedMessage = this.sanitizeMessage(message, ...args);
      const formattedMessage = this.formatMessage(level, sanitizedMessage);
      this.outputToConsole(level, formattedMessage);
    } else {
      // Local development OR non-sensitive data: log everything normally
      const formattedMessage = this.formatMessage(level, message, ...args);
      this.outputToConsole(level, formattedMessage);
    }
  }

  sanitizeMessage(message, ...args) {
    let sanitized = message;

    // Sanitize critical supply status messages (operational intelligence)
    sanitized = sanitized.replace(
      /supplies?\s+are\s+critically\s+low/gi,
      "supply status updated"
    );
    sanitized = sanitized.replace(
      /supplies?\s+have\s+reached\s+zero/gi,
      "supply status updated"
    );
    sanitized = sanitized.replace(
      /out\s+of\s+supplies?/gi,
      "supply status changed"
    );
    sanitized = sanitized.replace(
      /supplies?\s+(exhausted|depleted)/gi,
      "supply status updated"
    );
    sanitized = sanitized.replace(
      /immediate\s+restocking\s+required/gi,
      "action required"
    );
    sanitized = sanitized.replace(/critical\s+supply/gi, "supply notification");
    sanitized = sanitized.replace(/zero\s+supplies?/gi, "supply status");

    // Sanitize operational intelligence messages with specifics
    sanitized = sanitized.replace(
      /supplies are critically low! Only \d+ days remaining/gi,
      "supply status updated"
    );
    sanitized = sanitized.replace(
      /supplies are running low\. \d+ days remaining/gi,
      "supply status updated"
    );
    sanitized = sanitized.replace(
      /supplies have reached ZERO today/gi,
      "supply status updated"
    );
    sanitized = sanitized.replace(
      /supplies are STILL at ZERO/gi,
      "supply status updated"
    );

    // Replace specific supply numbers with placeholders
    sanitized = sanitized.replace(/\b\d+\s*supplies?\b/gi, "X supplies");
    sanitized = sanitized.replace(
      /\b\d+\s*days?\s*(left|remaining)\b/gi,
      "X days remaining"
    );
    sanitized = sanitized.replace(
      /\b(current|daily|remaining)\s*:\s*\d+/gi,
      "$1: X"
    );
    sanitized = sanitized.replace(/\bsupplies?\s*:\s*\d+/gi, "supplies: X");
    sanitized = sanitized.replace(
      /\bconsumption\s*:\s*\d+/gi,
      "consumption: X"
    );

    // Replace Discord webhook URLs but keep the fact that it's a webhook
    sanitized = sanitized.replace(
      /https:\/\/discord\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+/g,
      "[Discord webhook URL]"
    );

    // Replace service account emails
    sanitized = sanitized.replace(
      /[a-zA-Z0-9-]+@[a-zA-Z0-9-]+\.iam\.gserviceaccount\.com/g,
      "[Service account email]"
    );

    // Keep error context but sanitize any numbers that might be supply-related
    if (
      sanitized.toLowerCase().includes("error") ||
      sanitized.toLowerCase().includes("failed")
    ) {
      // Don't sanitize error messages too aggressively - just the obvious supply data
      sanitized = sanitized.replace(
        /\b\d+(?=\s*(supplies?|days?|consumption))/gi,
        "X"
      );
    }

    return sanitized;
  }

  outputToConsole(level, formattedMessage) {
    if (level === "debug" || level === "info") {
      console.log(formattedMessage);
    } else if (level === "warn") {
      console.warn(formattedMessage);
    } else if (level === "error") {
      console.error(formattedMessage);
    }
  }

  debug(message, ...args) {
    if (this.shouldLog("debug")) {
      this.writeLog("debug", message, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog("info")) {
      this.writeLog("info", message, ...args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog("warn")) {
      this.writeLog("warn", message, ...args);
    }
  }

  error(message, ...args) {
    if (this.shouldLog("error")) {
      this.writeLog("error", message, ...args);
    }
  }
}

const logger = new Logger();

module.exports = { logger, Logger };
