// pages/api/city-input.js

import fetch from 'node-fetch';

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

  const getOrCreateItem = async (collectionId, itemName, relatedCountryId = null) => {
    let response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items?limit=1&name=${itemName}`, {
      headers: headers
    });
    let data = await response.json();

    let itemId;
    if (!data.items || data.items.length === 0) {
      const fieldData = { name: itemName };
      if (relatedCountryId) {
        fieldData.country = relatedCountryId;
      }

      response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          isArchived: false,
          isDraft: false,
          fieldData
        })
      });
      data = await response.json();
      itemId = data.id;

      // Publish the item
      response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/publish`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          publishedItemIds: [itemId]
        })
      });
      await response.json();
    } else {
      itemId = data.items[0].id;
    }

    return itemId;
  };

  try {
    // Step 1: Check and publish country first, and get its ID
    const countryId = await getOrCreateItem('6511b5541b122aea972eaf8f', country);

    // Step 2: Then check and publish city, linking it to the country
    await getOrCreateItem('6511b5388842397b68f73aad', city, countryId);

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.log('Error:', JSON.stringify(error, null, 2));
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
