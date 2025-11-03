import { URL } from 'node:url';

const DEFAULT_ENDPOINT = 'https://data.nayaone.com/cah_synth_data';

export interface NayaOneDatasetOptions {
  offset?: number;
  limit?: number;
}

export interface NayaOneDatasetResponse {
  records: Record<string, unknown>[];
  offset: number;
}

export async function fetchNayaOneDataset({
  offset = 0,
  limit = 10,
}: NayaOneDatasetOptions = {}): Promise<NayaOneDatasetResponse> {
  const apiKey = process.env.NAYAONE_API_KEY;
  if (!apiKey) {
    throw new Error('NAYAONE_API_KEY is not configured');
  }

  if (offset < 0 || !Number.isFinite(offset)) {
    throw new Error('offset must be a positive number');
  }

  if (limit <= 0 || !Number.isFinite(limit)) {
    throw new Error('limit must be a positive number');
  }

  const endpoint = process.env.NAYAONE_API_URL ?? DEFAULT_ENDPOINT;
  const url = new URL(endpoint);
  if (offset) {
    url.searchParams.set('offset', String(Math.floor(offset)));
  }

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Profile': 'api',
      'sandpit-key': apiKey,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `NayaOne dataset request failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format from NayaOne dataset');
  }

  return {
    records: data as Record<string, unknown>[],
    offset,
  };
}
