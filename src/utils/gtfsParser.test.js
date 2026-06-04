import { parseGTFSStatus, extractGTrainAlerts } from './gtfsParser';
const { TextEncoder } = require('util');

// Parser requires data length > 100 to be considered valid
const pad = (s) => s + ' '.repeat(150);

const FULL_ROUTE = pad('G22N G26N G28N G33N F24N F27N');
const NORTH_ONLY = pad('G22N G26N G28N G33N');
const SOUTH_ONLY = pad('G33N F24N F27N');
const NO_SERVICE = pad('no stop ids here at all');

describe('parseGTFSStatus', () => {
  test('returns YES when full route stop IDs present', () => {
    const result = parseGTFSStatus(FULL_ROUTE, null, null);
    expect(result.status).toBe('YES');
    expect(result.statusMessage).toBeNull();
  });

  test('returns NO when no G train stop IDs found', () => {
    const result = parseGTFSStatus(NO_SERVICE, null, null);
    expect(result.status).toBe('NO');
  });

  test('returns NO when data is too short', () => {
    const result = parseGTFSStatus('G22N', null, null);
    expect(result.status).toBe('NO');
  });

  test('returns KIND OF when north end present but south terminal missing', () => {
    const result = parseGTFSStatus(NORTH_ONLY, null, null);
    expect(result.status).toBe('KIND OF');
  });

  test('returns KIND OF when south end present but north terminal missing', () => {
    const result = parseGTFSStatus(SOUTH_ONLY, null, null);
    expect(result.status).toBe('KIND OF');
  });

  test('KIND OF includes service range from stop IDs', () => {
    const result = parseGTFSStatus(NORTH_ONLY, null, null);
    expect(result.serviceDetails[0]).toContain('Court Square-23 St');
    expect(result.serviceDetails[0]).toContain('Bedford-Nostrand Aves');
  });

  test('KIND OF includes alert text when provided', () => {
    const alert = 'G trains are delayed due to signal problems at Hoyt-Schermerhorn';
    const result = parseGTFSStatus(NORTH_ONLY, null, alert);
    expect(result.serviceDetails).toContain(alert);
  });

  test('KIND OF without alert text falls back to keyword detection', () => {
    const result = parseGTFSStatus(pad('G22N G28N shuttle service'), null, null);
    expect(result.serviceDetails.join(' ')).toMatch(/shuttle/i);
  });
});

describe('extractGTrainAlerts', () => {
  const encode = (str) => new TextEncoder().encode(str);

  test('returns null when no data provided', () => {
    expect(extractGTrainAlerts(null)).toBeNull();
  });

  test('extracts a G train alert string from binary data', () => {
    const alertStr = 'G trains are delayed due to signal problems at Hoyt-Schermerhorn Sts';
    const padding = new Uint8Array(50).fill(0x01);
    const alertBytes = encode(alertStr);
    const combined = new Uint8Array([...padding, ...alertBytes, ...padding]);
    expect(extractGTrainAlerts(combined)).toBe(alertStr);
  });

  test('returns null when no G train alerts in data', () => {
    const data = encode('A trains are running normally on all lines today here');
    expect(extractGTrainAlerts(data)).toBeNull();
  });

  test('ignores strings shorter than 25 chars', () => {
    const data = encode('G train delay');
    expect(extractGTrainAlerts(data)).toBeNull();
  });
});
