# Is The G Train Running?

A simple website that shows whether the NYC G train is currently running, inspired by [isthelrunning.com](https://isthelrunning.com/).

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the App

```bash
npm start
```
The app will open at `http://localhost:3000`

### 3. Run Tests

```bash
npm test
```

## Architecture

React frontend only — no backend server. The app fetches two MTA GTFS-RT feeds directly from the browser:

- `nyct/gtfs-g` — G train trip updates (binary protobuf, decoded via text/regex on stop IDs)
- `camsys/subway-alerts` — subway-wide service alerts (scanned for G train alert text)

Status is determined by checking for presence of terminal stop IDs in the feed:
- **YES** — both `G22` (Court Square) and `F27` (Church Av) stop IDs present
- **KIND OF** — some G train stops present but not the full route; shows service range + alert reason
- **NO** — no G train stop IDs found

## Deployment

Push to `main` — GitHub Actions builds the app and deploys to GitHub Pages automatically.
Live at [www.isthegtrainrunning.com](https://www.isthegtrainrunning.com).

## Testing UI States

Append `?mock=` to the URL to test each status without waiting for a real disruption:

- `?mock=yes` — full service
- `?mock=no` — no service
- `?mock=kindof` — partial service with delay reason
- `?mock=kindof2` — partial service with shuttle bus