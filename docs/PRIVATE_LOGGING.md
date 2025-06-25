# Private Logging

This project uses targeted private logging to protect sensitive supply data while maintaining full visibility for debugging and errors.

## What's Protected (Private)

Only specific **supply-related sensitive data and tactical intelligence** is sanitized in public GitHub Actions logs:

- 🔒 **Supply numbers**: Current supplies, daily consumption amounts
- 🔒 **Supply calculations**: Days remaining, consumption rates
- 🔒 **Tactical status**: "Supplies are critically low", "Supplies have reached zero"
- 🔒 **Operational intelligence**: Army readiness, supply crisis alerts
- 🔒 **Discord webhook URLs**: Contains authentication tokens
- 🔒 **Service account emails**: Google Cloud credentials
- 🔒 **Cell values in supply context**: When discussing specific supply amounts

## What's Public (Fully Logged)

Everything else is logged normally in GitHub Actions:

- ✅ **Sheet names**: "Processing sheet: Saraian 1st Army"
- ✅ **Error messages**: Full error details and stack traces
- ✅ **Configuration issues**: Validation errors, setup problems
- ✅ **Operation status**: Success/failure, timing, general progress
- ✅ **Google Sheets API errors**: Authentication failures, permission issues
- ✅ **Discord notification status**: Success/failure (without webhook URLs)

## Examples

### Local Development (Full Details)

```
[2025-06-25T22:15:30.123Z] INFO  Processing sheet: Saraian 1st Army
[2025-06-25T22:15:30.456Z] INFO  Current supplies: 45, Daily consumption: 5
[2025-06-25T22:15:30.789Z] WARN  Saraian 1st Army supplies are critically low
[2025-06-25T22:15:31.012Z] ERROR Saraian 3rd Army supplies have reached zero! Immediate restocking required
[2025-06-25T22:15:31.234Z] ERROR Authentication failed for service account
```

### GitHub Actions (Sanitized Supply Data & Tactical Intelligence)

```
[2025-06-25T22:15:30.123Z] INFO  Processing sheet: Saraian 1st Army
[2025-06-25T22:15:30.456Z] INFO  Current supplies: X, Daily consumption: X
[2025-06-25T22:15:30.789Z] WARN  Saraian 1st Army supply status updated
[2025-06-25T22:15:31.012Z] ERROR Saraian 3rd Army supply status updated! action required
[2025-06-25T22:15:31.234Z] ERROR Authentication failed for service account
```

Notice how:

- **Sheet names** remain visible for debugging
- **Supply numbers** are replaced with "X"
- **Tactical status messages** are sanitized to "supply status updated"
- **Log levels are preserved**: INFO stays INFO, WARN stays WARN, ERROR stays ERROR
- **Error messages** are fully visible (they help with debugging)
- **Operational context** is preserved without revealing tactical intelligence

## Log Level Consistency

**Critical Security Feature**: Log levels remain exactly the same between local development and GitHub Actions. This prevents analysis of log level patterns to determine when supply issues occur.

For example:

- Supply notifications that are normally `INFO` level remain `INFO` level (just with sanitized content)
- Low supply warnings that are normally `WARN` level remain `WARN` level
- System errors remain `ERROR` level

This ensures that the **frequency and pattern of different log levels** doesn't reveal tactical information.

## Local Development

Full logging with all details:

```bash
# Complete detailed logging
npm start

# Maximum debug output
LOG_LEVEL=debug npm start

# Validation with full details
npm run validate
```
