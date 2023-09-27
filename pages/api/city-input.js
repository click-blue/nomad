// pages/api/city-input.js

import fetch from 'node-fetch';
import { generateMetaTitle } from './generateMetaTitle';

const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;

async function checkOrCreateItem(collectionId, name) {
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  // Check if item exists
  let response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items?filter[slug]=${slug}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
  });

  if (response.status !== 200) {
    const errorText = await response.text();
    throw new Error(`Webflow API request failed with status code ${response.status}: ${errorText}`);
  }

  const existingItems = await response.json();

  // If item exists, return its ID
  if (existingItems.items.length > 0) {
    return existingItems.items[0]._id;
  }

  // Create a new item
  response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        name,
        slug
      }
    })
  });

  if (response.status !== 202) {
    const errorText = await response.text();
    throw new Error(`Webflow API request failed with status code ${response.status}: ${errorText}`);
  }

  const newItem = await response.json();
  return newItem._id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { city, country } = req.body;

  try {
    // Processing country
    const countryId = await checkOrCreateItem('6511b5541b122aea972eaf8f', country);

    // Execute tasks
    let additionalFields = {};
    const metaTitle = await generateMetaTitle(city);
    additionalFields['Meta Title'] = metaTitle;

    // Processing city
    const cityId = await checkOrCreateItem('6511b5388842397b68f73aad', city);
    const updateResponse = await fetch(`https://api.webflow.com/v2/collections/6511b5388842397b68f73aad/items/${cityId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          ...additionalFields
        }
      })
    });

    if (updateResponse.status !== 202) {
      const errorText = await updateResponse.text();
      throw new Error(`Webflow API request failed with status code ${updateResponse.status}: ${errorText}`);
    }

    return res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Error occurred:', error.message);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
