const express = require('express');
const fetch = require('node-fetch');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');

const app = express();
const PORT = 5000;

const MTA_SUBWAY_URL = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g';


app.get('/g-train-status', async (req, res) => {
  try {
    const response = await fetch(MTA_SUBWAY_URL);
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));

    const trips = feed.entity
      .filter(entity => entity.tripUpdate && entity.tripUpdate.trip.routeId === 'G')
      .map(entity => ({
        tripId: entity.tripUpdate.trip.tripId,
        stopTimeUpdates: entity.tripUpdate.stopTimeUpdate,
      }));

    res.json({ trips });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch G train data' });
  }
});

app.listen(PORT, () => {
  console.log(`🚉 G Train Proxy running at http://localhost:${PORT}`);
});
