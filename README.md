# Supply Status Monitor

A GitHub Actions cron job that monitors Google Sheets for supply levels and sends notifications to Discord webhooks.

## Features

- Monitors multiple Google Sheets with identical formats
- Calculates remaining supply days based on current stock and daily consumption
- Sends formatted notifications to Discord webhooks
- Runs daily via GitHub Actions
- Uses Google Service Account for secure sheet access

## Setup

1. **Google Service Account Setup**
   - Create a Google Cloud Project
   - Enable Google Sheets API
   - Create a Service Account and download the JSON key
   - Share your Google Sheets with the service account email

2. **Discord Webhook Setup**
   - Create webhooks in your Discord channels
   - Copy the webhook URLs

3. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. **Configuration**
   Edit `config/sheets.json` to add your sheet and webhook pairs.

5. **Install Dependencies**
   ```bash
   npm install
   ```

## Configuration

### sheets.json Format
```json
[
  {
    "name": "Office Supplies",
    "sheetId": "your-google-sheet-id",
    "webhookUrl": "your-discord-webhook-url",
    "currentSuppliesCell": "B2",
    "dailyConsumptionCell": "B3"
  }
]
```

### Cell Format
- **Current Supplies Cell**: Should contain a number representing current stock
- **Daily Consumption Cell**: Should contain a number representing daily usage rate

## Usage

Run locally:
```bash
npm start
```

The GitHub Action will run automatically once per day at UTC midnight.

## Environment Variables

- `GOOGLE_SERVICE_ACCOUNT_KEY`: Base64 encoded service account JSON key
- `SHEETS_CONFIG`: JSON string of sheet configurations (for GitHub Actions)

## GitHub Actions

The workflow file (`.github/workflows/supply-monitor.yml`) is configured to:
- Run daily at midnight UTC
- Use repository secrets for sensitive data
- Send notifications on failure

## License

MIT
