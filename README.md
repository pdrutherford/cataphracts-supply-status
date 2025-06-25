# Supply Status Monitor

A GitHub Actions cron job that monitors Google Sheets for supply levels and sends notifications to Discord webhooks.

## Features

- Monitors multiple Google Sheets with identical formats
- **Automatically subtracts daily consumption from current supplies and updates the sheet**
- Calculates remaining supply days based on updated stock and daily consumption
- Sends formatted notifications to Discord webhooks
- Runs daily via GitHub Actions
- Uses Google Service Account for secure sheet access

## Setup

1. **Google Service Account Setup**

   - Create a Google Cloud Project
   - Enable Google Sheets API
   - Create a Service Account and download the JSON key
   - Share your Google Sheets with the service account email (with **Editor** permissions)

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
    "sheetName": "Inventory Data",
    "webhookUrl": "your-discord-webhook-url",
    "currentSuppliesCell": "B2",
    "dailyConsumptionCell": "B3"
  }
]
```

### Configuration Fields

- **name**: A descriptive name for your supply category
- **sheetId**: The ID of your Google Spreadsheet (found in the URL)
- **sheetName** _(optional)_: The name of the specific sheet tab to use. If not provided, the first sheet will be used
- **webhookUrl**: Your Discord webhook URL for notifications
- **currentSuppliesCell**: Cell reference for current stock (e.g., "B2")
- **dailyConsumptionCell**: Cell reference for daily consumption rate (e.g., "B3")

### Common Use Cases

1. **Single Sheet with One Tab**

   ```json
   {
     "name": "Office Supplies",
     "sheetId": "your-sheet-id",
     "currentSuppliesCell": "B2",
     "dailyConsumptionCell": "B3"
   }
   ```

   _No `sheetName` needed - uses the first (and only) sheet tab._

2. **Multiple Tabs in Same Spreadsheet**

   ```json
   [
     {
       "name": "Q1 Office Supplies",
       "sheetId": "your-sheet-id",
       "sheetName": "Q1 Data",
       "currentSuppliesCell": "B2",
       "dailyConsumptionCell": "B3"
     },
     {
       "name": "Q2 Office Supplies",
       "sheetId": "your-sheet-id",
       "sheetName": "Q2 Data",
       "currentSuppliesCell": "B2",
       "dailyConsumptionCell": "B3"
     }
   ]
   ```

   _Monitor different quarters from the same spreadsheet._

3. **Mixed Configuration**
   ```json
   [
     {
       "name": "Kitchen Supplies",
       "sheetId": "kitchen-sheet-id",
       "currentSuppliesCell": "B2",
       "dailyConsumptionCell": "B3"
     },
     {
       "name": "Office Inventory",
       "sheetId": "office-sheet-id",
       "sheetName": "Current Inventory",
       "currentSuppliesCell": "C5",
       "dailyConsumptionCell": "C6"
     }
   ]
   ```
   _Mix sheets with and without specific tab names._

### Sheet Selection

The monitor now supports flexible sheet selection:

- **Specific Sheet**: Set `sheetName` to target a specific sheet tab (e.g., "Inventory Data", "Q1 Supplies")
- **First Sheet**: Omit `sheetName` to automatically use the first sheet tab
- **Multiple Sheets**: Configure multiple entries with different `sheetName` values to monitor different tabs in the same spreadsheet

### Cell Format

- **Current Supplies Cell**: Should contain a number representing current stock (will be automatically updated)
- **Daily Consumption Cell**: Should contain a number representing daily usage rate

**Note**: Each time the script runs, it will automatically subtract the daily consumption value from the current supplies and update the Google Sheet with the new value. This ensures your supply tracking stays current without manual intervention.

## Usage

Run locally:

```bash
npm start
```

Validate your sheet configurations:

```bash
npm run validate
```

The validation script will:

- Check if all specified sheets exist
- Verify that target sheet tabs are accessible
- Test reading from your configured cells
- Display helpful debugging information

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
