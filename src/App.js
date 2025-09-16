import { useEffect, useState } from 'react';
import { parseGTFSStatus } from './utils/gtfsParser';
import './App.css';

function App() {
  const [status, setStatus] = useState('LOADING');
  const [nextTrainMinutes, setNextTrainMinutes] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGtrainStatus = async () => {
      try {
        console.log('Starting G train status check...');
        
        // For now, let's use a simple mock response to test if the app loads
        // We'll add the real API call back once we confirm the app is working
        const mockResponse = {
          status: 'YES',
          nextTrainMinutes: 5,
          statusMessage: null
        };
        
        console.log('Mock response:', mockResponse);
        setStatus(mockResponse.status);
        setNextTrainMinutes(mockResponse.nextTrainMinutes);
        setStatusMessage(mockResponse.statusMessage);
        
        // TODO: Uncomment this when ready to use real MTA API
        /*
        const response = await fetch('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g');
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const textData = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false }).decode(uint8Array);
          const result = parseGTFSStatus(textData, uint8Array);
          
          setStatus(result.status);
          setNextTrainMinutes(result.nextTrainMinutes);
          setStatusMessage(result.statusMessage);
        } else {
          setStatus('NO');
          setNextTrainMinutes(null);
          setStatusMessage('Unable to connect to MTA services');
        }
        */
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
  }, []);

  return (
    <div className="App">
      <div className="content">
        <div className="logo-section">
          <img src="%PUBLIC_URL%/g-train-logo.svg" alt="NYC Subway G Train Logo" className="g-train-logo" />
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
        
        {status === 'YES' && nextTrainMinutes && (
          <p className="sub-message">
            Yay! Next train in {nextTrainMinutes} minutes
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
