# Is The G Train Running?

A simple website that shows whether the NYC G train is currently running, inspired by [isthelrunning.com](https://isthelrunning.com/).

## Features

- Real-time G train status from MTA API
- Clean, minimal design
- Automatic status updates every 5 minutes
- Responsive design for all devices

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

## How It Works

The app fetches real-time G train data from the MTA's GTFS (General Transit Feed Specification) API endpoint:
`https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g`

The GTFS parser analyzes the data to determine if the G train is currently running and displays:
- **YES** (green) - G train is running
- **NO** (red) - G train is not running
- **LOADING** - Checking status

## API Endpoint

The app uses the MTA's GTFS feed for the G train, which provides:
- Real-time trip updates
- Vehicle positions
- Service alerts
- Schedule information

**Note**: MTA feeds are now free and don't require API keys or authentication.

## Technologies Used

- React 18
- MTA GTFS API
- Modern CSS with responsive design
