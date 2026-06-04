import { useEffect, useState } from 'react';
import { parseGTFSStatus, extractGTrainAlerts } from './utils/gtfsParser';
import './App.css';

const MTA_G_FEED = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g';
const MTA_ALERTS_FEED = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts';

const MOCK_STATES = {
  yes:     { status: 'YES',      statusMessage: null,                              serviceDetails: [] },
  no:      { status: 'NO',       statusMessage: 'No G train service detected',     serviceDetails: [] },
  kindof:  { status: 'KIND OF',  statusMessage: 'The G train is running with service changes', serviceDetails: [
    'Service running: Court Square-23 St → Bedford-Nostrand Aves',
    'G trains are delayed due to signal problems at Hoyt-Schermerhorn Sts',
  ]},
  kindof2: { status: 'KIND OF',  statusMessage: 'The G train is running with service changes', serviceDetails: [
    'Service running: Nassau Av → Church Av',
    'Shuttle bus service in effect between Court Square and Nassau Av',
  ]},
};

const getMockState = () => {
  const param = new URLSearchParams(window.location.search).get('mock');
  return param ? MOCK_STATES[param] ?? null : null;
};

const decodeFeed = async (url) => {
  const response = await fetch(url);
  if (!response.ok) return null;
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false }).decode(uint8Array);
  return { uint8Array, text };
};

function App() {
  const [status, setStatus] = useState('LOADING');
  const [statusMessage, setStatusMessage] = useState(null);
  const [serviceDetails, setServiceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    if (diffInSeconds < 60) return `As of ${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `As of ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    const hours = Math.floor(diffInSeconds / 3600);
    return `As of ${hours} hour${hours !== 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    const checkGtrainStatus = async () => {
      // Check for mock mode first (?mock=yes|no|kindof|kindof2)
      const mockState = getMockState();
      if (mockState) {
        setStatus(mockState.status);
        setStatusMessage(mockState.statusMessage);
        setServiceDetails(mockState.serviceDetails);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      try {
        // Fetch main feed and alerts feed in parallel
        const [mainFeed, alertsFeed] = await Promise.all([
          decodeFeed(MTA_G_FEED),
          decodeFeed(MTA_ALERTS_FEED),
        ]);

        if (!mainFeed) {
          setStatus('NO');
          setStatusMessage('Unable to connect to MTA services');
          return;
        }

        const alertText = alertsFeed ? extractGTrainAlerts(alertsFeed.uint8Array) : null;
        const result = parseGTFSStatus(mainFeed.text, mainFeed.uint8Array, alertText);

        setStatus(result.status);
        setStatusMessage(result.statusMessage);
        setServiceDetails(result.serviceDetails || []);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching G train status:', error);
        setStatus('NO');
        setStatusMessage('Service status unavailable');
      } finally {
        setLoading(false);
      }
    };

    checkGtrainStatus();
    const interval = setInterval(checkGtrainStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update "X seconds ago" display every second
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => setLastUpdated(prev => new Date(prev.getTime())), 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="App">
      <div className="content">
        <div className="logo-section">
          <img src="./g-train-logo.svg" alt="NYC Subway G Train Logo" className="g-train-logo" />
        </div>

        <div className="status-section">
          {loading ? (
            <p className="status-loading">Checking G train status...</p>
          ) : (
            <p className={`status-result status-${status.toLowerCase().replace(' ', '-')}`}>{status}</p>
          )}
        </div>

        {status === 'NO' && <p className="main-message">Bad luck, buddy.</p>}
        {status === 'KIND OF' && <p className="main-message">Kind of!</p>}
        {status === 'YES' && lastUpdated && (
          <p className="sub-message">Yay! {getTimeAgo(lastUpdated)}</p>
        )}

        {(status === 'NO' || status === 'KIND OF') && (statusMessage || serviceDetails.length > 0) && (
          <div className="status-message">
            {statusMessage && <p>{statusMessage}</p>}
            {serviceDetails.length > 0 && (
              <div className="service-details">
                {serviceDetails.map((detail, index) => (
                  <p key={index} className="service-detail-item">{detail}</p>
                ))}
              </div>
            )}
            <a href="https://mta.info" target="_blank" rel="noopener noreferrer" className="mta-link">
              Check MTA.info for details →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
