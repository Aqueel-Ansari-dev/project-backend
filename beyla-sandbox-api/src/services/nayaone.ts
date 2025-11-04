import { URL } from 'node:url';

const DEFAULT_ENDPOINT = 'https://data.nayaone.com/cah_synth_data';

export class NayaOneRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(message);
    this.name = 'NayaOneRequestError';
  }
}

export interface NayaOneDatasetResponse {
  records: Record<string, unknown>[];
  offset: number;
}

export async function fetchNayaOneDataset(offset = 0): Promise<NayaOneDatasetResponse> {
  const apiKey = process.env.NAYAONE_API_KEY;
  if (!apiKey) {
    throw new Error('NAYAONE_API_KEY is not configured');
  }

  if (offset < 0 || !Number.isFinite(offset)) {
    throw new Error('offset must be a positive number');
  }

  const endpoint = process.env.NAYAONE_API_URL ?? DEFAULT_ENDPOINT;
  const url = new URL(endpoint);
  if (offset) {
    url.searchParams.set('offset', String(Math.floor(offset)));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Profile': 'api',
        'sandpit-key': apiKey,
      },
    });
  } catch (err) {
    throw new NayaOneRequestError(
      err instanceof Error ? err.message : 'Unknown NayaOne request error',
      503,
      ''
    );
  }

  if (!response.ok) {
    const message = await response.text();
    throw new NayaOneRequestError(
      `NayaOne dataset request failed with status ${response.status}`,
      response.status,
      message
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
