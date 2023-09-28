// pages/api/city-input.js

import fetch from 'node-fetch';
import { generateMetaTitle } from './generateMetaTitle';
import { checkOrCreateItem } from './webflowOperations.js';

const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed, only POST requests are accepted.' });
  }

  const { city, country } = req.body;

  try {
    // Processing country
    const countryId = await checkOrCreateItem('6511b5541b122aea972eaf8f', 'name', country);

    // Execute tasks
    let additionalFields = {};
    const metaTitle = await generateMetaTitle(city);
    additionalFields['metaTitle'] = metaTitle;  

    // Processing city
    const cityId = await checkOrCreateItem('6511b5388842397b68f73aad', 'name', city, countryId);
    const patchUrl = `https://api.webflow.com/v2/collections/6511b5388842397b68f73aad/items/${cityId}`;
    console.log('Patch URL:', patchUrl);  // Log the patch URL to diagnose
    const patchResponse = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        fieldData: {
          ...additionalFields
        }
      })
    });

    // Log the response from Webflow
    const patchResponseJson = await patchResponse.json();
    console.log('Patch Response:', patchResponseJson);

    if (!patchResponse.ok) {
      const errorText = JSON.stringify(patchResponseJson);
      throw new Error(`Webflow API request failed with status code ${patchResponse.status}: ${errorText}`);
    }

    return res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Error occurred:', error.message);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
