// pages/api/city-input.js

import fetch from 'node-fetch';
import { generateMetaTitle } from './generateMetaTitle';

const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { city, country } = req.body;

  const headers = {
    'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    // Processing country
    let response = await fetch(`https://api.webflow.com/v2/collections/6511b5541b122aea972eaf8f/items`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        fields: {
          name: country,
          slug: country.toLowerCase().replace(/\s+/g, '-')
        }
      })
    });
    
    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Webflow API request failed with status code ${response.status}: ${errorText}`);
    }

    // Execute tasks
    let additionalFields = {};
    const metaTitle = await generateMetaTitle(city);
    additionalFields['Meta Title'] = metaTitle;

    // Processing city
    response = await fetch(`https://api.webflow.com/v2/collections/6511b5388842397b68f73aad/items`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        fields: {
          name: city,
          slug: city.toLowerCase().replace(/\s+/g, '-'),
          ...additionalFields
        }
      })
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Webflow API request failed with status code ${response.status}: ${errorText}`);
    }

    return res.status(200).json({ status: 'success' });

  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
}

