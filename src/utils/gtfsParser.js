// G train stops in order north → south
// Stop IDs appear as literal strings in GTFS-RT binary protobuf data
const G_STOPS = [
  { id: 'G22', name: 'Court Square-23 St' },
  { id: 'G24', name: '21 St' },
  { id: 'G26', name: 'Greenpoint Av' },
  { id: 'G28', name: 'Nassau Av' },
  { id: 'G29', name: 'Metropolitan Av' },
  { id: 'G30', name: 'Broadway' },
  { id: 'G31', name: 'Flushing Av' },
  { id: 'G32', name: 'Myrtle-Willoughby Aves' },
  { id: 'G33', name: 'Bedford-Nostrand Aves' },
  { id: 'G34', name: 'Classon Av' },
  { id: 'G35', name: 'Clinton-Washington Aves' },
  { id: 'G36', name: 'Fulton St' },
  { id: 'A42', name: 'Hoyt-Schermerhorn Sts' },
  { id: 'F20', name: 'Bergen St' },
  { id: 'F21', name: 'Carroll St' },
  { id: 'F22', name: 'Smith-9th Sts' },
  { id: 'F23', name: '4 Av-9 St' },
  { id: 'F24', name: '7 Av' },
  { id: 'F25', name: '15 St-Prospect Park' },
  { id: 'F26', name: 'Fort Hamilton Pkwy' },
  { id: 'F27', name: 'Church Av' },
];

const NORTH_TERMINAL = /G22[NS]/;
const SOUTH_TERMINAL = /F27[NS]/;
const ANY_G_STOP = /G2[2-9][NS]|G3[0-6][NS]|A42[NS]|F2[0-7][NS]/;

// Option A: determine which stations are being served based on stop IDs in the feed
const getServiceRange = (data) => {
  const served = G_STOPS.filter(stop => new RegExp(stop.id + '[NS]').test(data));
  if (served.length === 0) return null;
  if (served.length === 1) return served[0].name;
  return `${served[0].name} → ${served[served.length - 1].name}`;
};

// Option B: extract readable G train alert text from the alerts binary feed
// Strings are stored as literal UTF-8 bytes in protobuf — we scan for printable sequences
export const extractGTrainAlerts = (alertsData) => {
  if (!alertsData) return null;

  // Pull out all readable ASCII strings >= 25 chars
  const strings = [];
  let current = '';
  for (let i = 0; i < alertsData.length; i++) {
    const byte = alertsData[i];
    if (byte >= 0x20 && byte <= 0x7E) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= 25) strings.push(current.trim());
      current = '';
    }
  }
  if (current.length >= 25) strings.push(current.trim());

  // Filter for strings that mention the G train AND describe a service condition
  const relevant = strings.filter(s => {
    const lower = s.toLowerCase();
    const mentionsG = /\bg\s+train/i.test(s) || /\bg-train/i.test(s) || /\bg line\b/i.test(s);
    const isServiceInfo = lower.includes('delay') || lower.includes('suspend') ||
      lower.includes('reroute') || lower.includes('divert') || lower.includes('skip') ||
      lower.includes('service change') || lower.includes('not running') ||
      lower.includes('running') || lower.includes('shuttle') || lower.includes('alternate');
    return mentionsG && isServiceInfo;
  });

  return relevant.length > 0 ? relevant[0] : null;
};

export const parseGTFSStatus = (gtfsData, binaryData = null, alertText = null) => {
  try {
    const hasValidData = binaryData ? binaryData.length > 100 : gtfsData.length > 100;
    if (!hasValidData) {
      return { status: 'NO', statusMessage: 'No data from MTA', serviceDetails: [] };
    }

    const hasAnyService = ANY_G_STOP.test(gtfsData);
    if (!hasAnyService) {
      return { status: 'NO', statusMessage: 'No G train service detected', serviceDetails: [] };
    }

    const hasNorthEnd = NORTH_TERMINAL.test(gtfsData);
    const hasSouthEnd = SOUTH_TERMINAL.test(gtfsData);

    if (hasNorthEnd && hasSouthEnd) {
      return { status: 'YES', statusMessage: null, serviceDetails: [] };
    }

    // Partial service — build details from stop range + alert text
    const serviceDetails = buildPartialServiceDetails(gtfsData, alertText);
    return {
      status: 'KIND OF',
      statusMessage: 'The G train is running with service changes',
      serviceDetails,
    };
  } catch (error) {
    console.error('Error parsing GTFS data:', error);
    return { status: 'NO', statusMessage: 'Service status unavailable', serviceDetails: [] };
  }
};

const buildPartialServiceDetails = (data, alertText) => {
  const details = [];

  // Option A: show which stations are being served
  const range = getServiceRange(data);
  if (range) {
    details.push(`Service running: ${range}`);
  }

  // Option B: show alert reason from the alerts feed
  if (alertText) {
    details.push(alertText);
  } else {
    // Fall back to keyword detection in the main feed
    if (/shuttle/i.test(data)) details.push('Shuttle bus service in effect for some stations');
    if (/suspend/i.test(data)) details.push('Some service suspended');
    if (/delay/i.test(data)) details.push('Delays in service');
  }

  if (details.length === 0) {
    details.push('Limited service — check MTA.info for details');
  }

  return details;
};
