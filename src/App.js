import { useEffect, useState } from 'react';
import { parseGTFSStatus } from './utils/gtfsParser';
import './App.css';

function App() {
  const [status, setStatus] = useState('LOADING');
  const [nextTrainMinutes, setNextTrainMinutes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGtrainStatus = async () => {
      try {
        // MTA feeds are now free and don't require API keys
        const response = await fetch('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g');
        
        if (response.ok) {
          const data = await response.text();
          // Use the GTFS parser to determine if G train is running
          const result = parseGTFSStatus(data);
          setStatus(result.status);
          setNextTrainMinutes(result.nextTrainMinutes);
        } else {
          setStatus('NO');
          setNextTrainMinutes(null);
        }
      } catch (error) {
        console.error('Error fetching G train status:', error);
        setStatus('NO');
        setNextTrainMinutes(null);
      } finally {
        setLoading(false);
      }
    };

    checkGtrainStatus();
    
    // Check status every 5 minutes
    const interval = setInterval(checkGtrainStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <div className="content">
        <div className="logo-section">
          <img src="/g-train-logo.svg" alt="NYC Subway G Train Logo" className="g-train-logo" />
        </div>
        
        <div className="status-section">
          {loading ? (
            <p className="status-loading">Checking G train status...</p>
          ) : (
            <p className={`status-result status-${status.toLowerCase()}`}>{status}</p>
          )}
        </div>
        
        <p className="main-message">
          {status === 'NO' ? 'Bad luck, buddy.' : 'Take the [G] instead'}
        </p>
        
        {status === 'YES' && nextTrainMinutes && (
          <p className="sub-message">
            Yay! Next train in {nextTrainMinutes} minutes
          </p>
        )}
        
        <div className="bookmark-section">
          <p className="bookmark-text">Press Ctrl+D to Bookmark!</p>
        </div>
      </div>
    </div>
  );
}

export default App;
