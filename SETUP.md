# Setup Instructions

Follow these steps to set up your Supply Status Monitor:

## 1. Google Cloud Setup

### Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

### Create a Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `supply-status-monitor`
   - Description: `Service account for supply status monitoring`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### Generate a Key File
1. Find your newly created service account in the list
2. Click on it to open the details
3. Go to the "Keys" tab
4. Click "Add Key" > "Create New Key"
5. Choose "JSON" format and click "Create"
6. Save the downloaded JSON file securely

### Share Your Google Sheets
For each Google Sheet you want to monitor:
1. Open the Google Sheet
2. Click "Share" in the top right
3. Add the service account email (found in the JSON file as `client_email`)
4. Give it "Viewer" permissions
5. Click "Send"

## 2. Discord Webhook Setup

For each Discord channel where you want notifications:
1. Go to your Discord server
2. Right-click on the channel
3. Select "Edit Channel"
4. Go to "Integrations" tab
5. Click "Create Webhook"
6. Customize the webhook name and avatar if desired
7. Copy the webhook URL
8. Click "Save"

## 3. Local Development Setup

### Install Dependencies
```bash
npm install
```

### Configure Environment
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set:
   ```
   GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json
   SHEETS_CONFIG_PATH=./config/sheets.json
   ```

### Add Your Service Account Key
1. Place your downloaded service account JSON file in `config/service-account.json`

### Configure Your Sheets
1. Copy the example configuration:
   ```bash
   cp config/sheets.example.json config/sheets.json
   ```
2. Edit `config/sheets.json` with your actual:
   - Sheet names
   - Google Sheet IDs (from the URL)
   - Discord webhook URLs
   - Cell addresses for current supplies and daily consumption

### Test Locally
```bash
npm start
```

## 4. GitHub Actions Setup

### Add Repository Secrets
1. Go to your GitHub repository
2. Click "Settings" > "Secrets and variables" > "Actions"
3. Add these secrets:

#### GOOGLE_SERVICE_ACCOUNT_KEY
- Base64 encode your service account JSON file:
  ```bash
  # On macOS/Linux:
  base64 -i config/service-account.json
  
  # On Windows PowerShell:
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("config/service-account.json"))
  ```
- Copy the output and paste it as the secret value

#### SHEETS_CONFIG
- Copy the contents of your `config/sheets.json` file
- Paste it as the secret value (it should be valid JSON)

### Enable GitHub Actions
The workflow is already configured to run daily at midnight UTC. It will also run on manual trigger.

## 5. Google Sheets Format

Your Google Sheets should have:
- **Current Supplies** (e.g., in cell B2): A number representing current stock
- **Daily Consumption** (e.g., in cell B3): A number representing daily usage rate

Example:
```
A1: Current Supplies    B1: 
A2: Stock Level         B2: 150
A3: Daily Usage         B3: 5
```

The monitor will calculate: 150 ÷ 5 = 30 days remaining

## 6. Discord Notifications

The bot will send:
- ✅ **Green**: 15+ days remaining
- ⚡ **Yellow**: 8-14 days remaining  
- ⚠️ **Orange**: 4-7 days remaining
- 🚨 **Red**: 1-3 days remaining

Critical and warning alerts include @everyone mentions.

## Troubleshooting

### Common Issues

1. **"No data found in cell"**
   - Check that the cell address is correct (e.g., "B2", not "b2")
   - Ensure the cell contains a number
   - Verify the service account has access to the sheet

2. **"Authentication failed"**
   - Check that the service account JSON is valid
   - Ensure the Google Sheets API is enabled
   - Verify the service account email is shared with the sheet

3. **"Discord webhook failed"**
   - Verify the webhook URL is correct
   - Check that the webhook hasn't been deleted
   - Ensure the Discord channel still exists

### Testing Tips

- Start with one sheet configuration to test
- Use `LOG_LEVEL=debug` for more detailed logs
- Test webhooks with a simple message first
- Verify sheet permissions with a manual API call
