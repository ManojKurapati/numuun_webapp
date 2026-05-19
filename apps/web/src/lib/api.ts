import { createBrowserTokenStore, NamoClient } from '@namo/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

let instance: NamoClient | null = null;

/** Shared, lazily created API client for the parent web app. */
export function api(): NamoClient {
  if (!instance) {
    instance = new NamoClient({
      baseUrl,
      tokens: createBrowserTokenStore('namo-web'),
    });
  }
  return instance;
}
