# Cataphracts Supply Status Monitor

Automated supply tracking for Cataphracts campaigns. Monitors Google Sheets for army supply levels and sends daily Discord notifications.

## What it does

- Reads current supplies and daily consumption from Google Sheets
- Subtracts daily consumption from current supplies
- Updates the sheet with new supply levels
- Sends Discord alerts when supplies are low
- Runs automatically once per day (configurable - see below)

## Setup

### 1. Google Cloud Setup

Create a Google Cloud project (free):

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create new project
3. Enable Google Sheets API (APIs & Services > Library)
4. Create Service Account (APIs & Services > Credentials)
5. Download the JSON key file
6. Share your Google Sheets with the service account email (Editor permissions)

### 2. Google Sheets Format

Your sheet must have these cells:

- **Current Supplies**: A number (e.g., cell B2: `150`)
- **Daily Consumption**: A number (e.g., cell B3: `5`)

Example layout:

```
A1: Army                    B1: Saraian 1st Army
A2: Current Supplies        B2: 150
A3: Daily Consumption       B3: 5
```

Names & position don't need to match; just so long as you provide the right locations.

### 3. Discord Webhooks

Create webhooks for notifications:

**Channel webhook:**

```
https://discord.com/api/webhooks/{webhook_id}/{token}
```

**Thread webhook:**

```
https://discord.com/api/webhooks/{webhook_id}/{token}?thread_id={thread_id}
```

To create: Right-click channel > Edit Channel > Integrations > Create Webhook > Copy URL

To get thread id:

1. User Settings > Advanced > Enable Developer Mode
1. Right-click thread > Copy Thread ID

### 4. GitHub Repository

1. Fork this repository
2. Add these secrets (Settings > Secrets and variables > Actions):
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: Base64-encoded service account JSON
   - `SHEETS_CONFIG`: JSON configuration (see below)

### 5. Configuration

Set `SHEETS_CONFIG` secret to JSON like this:

```json
[
  {
    "name": "Saraian 1st Army",
    "sheetId": "1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
    "sheetName": "Supply Tracker",
    "webhookUrl": "https://discord.com/api/webhooks/123/abc?thread_id=456",
    "currentSuppliesCell": "B2",
    "dailyConsumptionCell": "B3"
  }
]
```

**Configuration fields:**

- `name`: Army name for notifications
- `sheetId`: Google Sheet ID (from URL: `/d/{this-part}/edit`)
- `sheetName`: Sheet tab name (optional, uses first tab if omitted)
- `webhookUrl`: Discord webhook URL (with optional thread_id)
- `currentSuppliesCell`: Cell containing current supplies (e.g., "B2")
- `dailyConsumptionCell`: Cell containing daily consumption (e.g., "B3")

## Timing Configuration

The system runs daily at **midnight EST** (5 AM UTC). To change this:

1. Edit `.github/workflows/supply-monitor.yml`
2. Modify the cron schedule: `- cron: "0 5 * * *"`

**Cron format:** `minute hour day month weekday`

- `0 5 * * *` = 5 AM UTC daily (midnight EST)
- `0 12 * * *` = noon UTC daily
- `0 0 * * 1` = midnight UTC every Monday

**Time zones:** GitHub Actions runs in UTC. Calculate your local time offset.

## Example Output

The bot sends Discord embeds with supply status:

### Normal Status (15+ days remaining)

```
✅ Supply Status: Saraian 1st Army

📅 Current Day: Monday, June 25th
📦 Current Supplies: 150
📉 Daily Consumption: 5
⏰ Days Remaining: 30 days
🚨 Zero Supplies Date: Wednesday, July 25th
```

### Warning (4-7 days remaining)

```
⚠️ **WARNING**: Saraian 1st Army supplies are running low. 5 days remaining.

⚠️ Supply Status: Saraian 1st Army

📅 Current Day: Monday, June 25th
📦 Current Supplies: 25
📉 Daily Consumption: 5
⏰ Days Remaining: 5 days
🚨 Zero Supplies Date: Saturday, June 30th
```

### Critical (1-3 days remaining)

```
🚨 **URGENT**: Saraian 1st Army supplies are critically low! Only 2 days remaining.

🚨 Supply Status: Saraian 1st Army

📅 Current Day: Monday, June 25th
📦 Current Supplies: 10
📉 Daily Consumption: 5
⏰ Days Remaining: 2 days
🚨 Zero Supplies Date: Wednesday, June 27th
```

### Zero Supplies

```
🚨 **CRITICAL**: Saraian 1st Army supplies have reached ZERO today! Immediate restocking required.

🚨 ZERO SUPPLIES ALERT: Saraian 1st Army

📅 Current Day: Monday, June 25th
📦 Current Supplies: 0 (OUT OF STOCK)
📉 Daily Consumption: 5
⏰ Days Remaining: 0 days - IMMEDIATE ACTION REQUIRED
🚨 Status: Supplies have just been depleted today
```

## Alert Thresholds

- **Green** (✅): 15+ days remaining
- **Yellow** (⚡): 8-14 days remaining
- **Orange** (⚠️): 4-7 days remaining
- **Red** (🚨): 1-3 days remaining
- **Critical** (🚨): 0 days remaining

## Multiple Army Examples

### Separate Sheets

```json
[
  {
    "name": "Saraian 1st Army",
    "sheetId": "1AbCdEfGhIjKlMnOpQrStUvWxYz123",
    "webhookUrl": "https://discord.com/api/webhooks/111/aaa",
    "currentSuppliesCell": "B2",
    "dailyConsumptionCell": "B3"
  },
  {
    "name": "Keltic Raiders",
    "sheetId": "1ZyXwVuTsRqPoNmLkJiHgFe456",
    "webhookUrl": "https://discord.com/api/webhooks/222/bbb",
    "currentSuppliesCell": "B2",
    "dailyConsumptionCell": "B3"
  }
]
```

### Multiple Tabs, Same Sheet

```json
[
  {
    "name": "Saraian 1st Army",
    "sheetId": "1AbCdEfGhIjKlMnOpQrStUvWxYz123",
    "sheetName": "1st Army",
    "webhookUrl": "https://discord.com/api/webhooks/111/aaa?thread_id=333",
    "currentSuppliesCell": "B2",
    "dailyConsumptionCell": "B3"
  },
  {
    "name": "Saraian 2nd Army",
    "sheetId": "1AbCdEfGhIjKlMnOpQrStUvWxYz123",
    "sheetName": "2nd Army",
    "webhookUrl": "https://discord.com/api/webhooks/111/aaa?thread_id=444",
    "currentSuppliesCell": "B2",
    "dailyConsumptionCell": "B3"
  }
]
```

## Testing

Validate configuration:

```bash
npm install
npm run validate
```

Test run (will modify sheets and send Discord messages):

```bash
npm start
```

Manual GitHub Actions run: Go to Actions tab > Supply Status Monitor > Run workflow

## Troubleshooting

**"No data found in cell"**: Check cell address format ("B2" not "b2"), verify cell contains numbers

**"Authentication failed"**: Re-encode service account JSON to Base64, check Google Sheets API is enabled

**"Discord webhook failed"**: Verify webhook URL, check if webhook was deleted

**Wrong timing**: Modify cron schedule in `.github/workflows/supply-monitor.yml`

## License

MIT
