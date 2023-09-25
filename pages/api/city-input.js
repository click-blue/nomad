// pages/api/city-input.js

import fetch from 'node-fetch';

const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;

export default async function handler(req, res) {
  console.log("Handler invoked");
  
  if (req.method !== 'POST') {
    console.log("Method not POST");
    return res.status(405).end();
  }

  const { city, country } = req.body;
  console.log(`Received city: ${city}, country: ${country}`);

  const headers = {
    'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const getOrCreateItem = async (collectionId, itemName, relatedCountryId = null) => {
    console.log(`Fetching or creating item: ${itemName} in collection: ${collectionId}`);
    
    let response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items?limit=1&name=${itemName}`, {
      headers: headers
    });
    let data = await response.json();
    console.log(`Fetch response: ${JSON.stringify(data)}`);

    let itemId;
    if (!data.items || data.items.length === 0) {
      console.log(`Item not found, creating new item: ${itemName}`);
      
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
      console.log(`Create item response: ${JSON.stringify(data)}`);
      
      itemId = data.id;
      console.log(`Created item with ID: ${itemId}`);

      // Publish the item
      response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/publish`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          publishedItemIds: [itemId]
        })
      });
      data = await response.json();
      console.log(`Publish item response: ${JSON.stringify(data)}`);
    } else {
      itemId = data.items[0].id;
      console.log(`Found existing item with ID: ${itemId}`);
    }

    return itemId;
  };

  try {
    // Step 1: Check and publish country first, and get its ID
    console.log("Step 1: Processing country");
    const countryId = await getOrCreateItem('6511b5541b122aea972eaf8f', country);
    console.log(`Country ID: ${countryId}`);

    // Step 2: Then check and publish city, linking it to the country
    console.log("Step 2: Processing city");
    const cityId = await getOrCreateItem('6511b5388842397b68f73aad', city, countryId);
    console.log(`City ID: ${cityId}`);

    console.log("Successfully processed both country and city");
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.log('Error:', JSON.stringify(error, null, 2));
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
