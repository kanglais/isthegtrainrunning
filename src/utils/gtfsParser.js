// GTFS Parser utility for MTA G train data
export const parseGTFSStatus = (gtfsData) => {
  try {
    // GTFS data is typically in a binary format, but we can check for basic indicators
    // Look for trip updates, vehicle positions, or service alerts that indicate active service
    
    // Check if there are active trips (simplified approach)
    const hasActiveTrips = gtfsData.includes('G') && 
                          (gtfsData.includes('trip_id') || 
                           gtfsData.includes('vehicle') || 
                           gtfsData.includes('stop_time_update'));
    
    // Check if data is recent (within last few hours)
    const now = Math.floor(Date.now() / 1000);
    const dataTimestamp = extractTimestamp(gtfsData);
    const isRecent = dataTimestamp && (now - dataTimestamp) < 7200; // 2 hours
    
    if (hasActiveTrips && isRecent) {
      // Extract next train arrival time
      const nextTrainMinutes = extractNextTrainTime(gtfsData, now);
      return {
        status: 'YES',
        nextTrainMinutes: nextTrainMinutes
      };
    } else {
      return {
        status: 'NO',
        nextTrainMinutes: null
      };
    }
  } catch (error) {
    console.error('Error parsing GTFS data:', error);
    return {
      status: 'NO',
      nextTrainMinutes: null
    };
  }
};

const extractTimestamp = (data) => {
  // Try to extract timestamp from GTFS data
  // This is a simplified approach - you might need to enhance this based on actual data format
  try {
    // Look for common timestamp patterns in the data
    const timestampMatch = data.match(/\d{10,}/);
    if (timestampMatch) {
      return parseInt(timestampMatch[0]);
    }
    return null;
  } catch (error) {
    return null;
  }
};

const extractNextTrainTime = (data, currentTime) => {
  try {
    // Look for arrival times in the GTFS data
    // This is a simplified approach - in a real implementation you'd parse the actual GTFS structure
    const arrivalTimeMatches = data.match(/\d{10,}/g);
    
    if (arrivalTimeMatches) {
      // Find the next arrival time that's in the future
      const futureTimes = arrivalTimeMatches
        .map(time => parseInt(time))
        .filter(time => time > currentTime)
        .sort((a, b) => a - b);
      
      if (futureTimes.length > 0) {
        const nextArrival = futureTimes[0];
        const minutesUntilArrival = Math.ceil((nextArrival - currentTime) / 60);
        return Math.max(1, minutesUntilArrival); // Ensure at least 1 minute
      }
    }
    
    // Fallback: return a reasonable estimate if we can't parse specific times
    return 5; // Default to 5 minutes
  } catch (error) {
    console.error('Error extracting next train time:', error);
    return 5; // Default fallback
  }
};
