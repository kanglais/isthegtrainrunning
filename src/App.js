import { useEffect, useState } from 'react';
import { parseGTFSStatus } from './utils/gtfsParser';
import './App.css';

function App() {
  const [status, setStatus] = useState('LOADING');
  const [nextTrainMinutes, setNextTrainMinutes] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) {
      return `As of ${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `As of ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `As of ${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    const checkGtrainStatus = async () => {
      try {
        console.log('Starting G train status check...');
        
        // MTA feeds are now free and don't require API keys
        const response = await fetch('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g');
        
        if (response.ok) {
          // Get the response as an ArrayBuffer since it's binary protobuf data
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          console.log('=== MTA API RESPONSE DEBUG ===');
          console.log('API Response status:', response.status);
          console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
          console.log('Binary data length:', uint8Array.length);
          console.log('First 50 bytes:', Array.from(uint8Array.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' '));
          
          // Convert binary data to text for basic pattern matching
          const textData = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false }).decode(uint8Array);
          console.log('Decoded text length:', textData.length);
          console.log('Decoded text sample:', textData.substring(0, 500));
          console.log('=== END MTA API RESPONSE ===');
          
          // Use the GTFS parser to determine if G train is running
          const result = parseGTFSStatus(textData, uint8Array);
          console.log('Parser result:', result);
          
          setStatus(result.status);
          setNextTrainMinutes(result.nextTrainMinutes);
          setStatusMessage(result.statusMessage);
          setLastUpdated(new Date());
        } else {
          console.log('API Response failed:', response.status, response.statusText);
          setStatus('NO');
          setNextTrainMinutes(null);
          setStatusMessage('Unable to connect to MTA services');
        }
      } catch (error) {
        console.error('Error fetching G train status:', error);
        setStatus('NO');
        setNextTrainMinutes(null);
        setStatusMessage('Service status unavailable');
      } finally {
        setLoading(false);
      }
    };

    checkGtrainStatus();
    
    // Check status every 5 minutes
    const interval = setInterval(checkGtrainStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Update time display every second
  useEffect(() => {
    if (!lastUpdated) return;
    
    const interval = setInterval(() => {
      // Force re-render to update time display
      setLastUpdated(new Date(lastUpdated.getTime()));
    }, 1000);
    
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
            <p className={`status-result status-${status.toLowerCase()}`}>{status}</p>
          )}
        </div>
        
        {status === 'NO' && (
          <p className="main-message">Bad luck, buddy.</p>
        )}
        
        {status === 'YES' && lastUpdated && (
          <p className="sub-message">
            Yay! {getTimeAgo(lastUpdated)}
          </p>
        )}
        
        {status === 'NO' && statusMessage && (
          <div className="status-message">
            <p>{statusMessage}</p>
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
