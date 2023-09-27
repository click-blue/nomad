// pages/api/city-input.js

import fetch from 'node-fetch';
import taskConfig from './taskConfig'; 
import { generateMetaTitle } from './generateMetaTitle';  

const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;

export default async function handler(req, res) {
  console.log("Handler invoked");
  console.log("Task Config:", JSON.stringify(taskConfig, null, 2));

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

  const getOrCreateItem = async (collectionId, itemName, relatedCountryId = null, additionalFields = {}) => {
    let response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
      headers: headers
    });
    let data = await response.json();
  
    let itemId = null;
    if (data.items) {
      const foundItem = data.items.find(item => item.fieldData.name === itemName);
      if (foundItem) {
        itemId = foundItem.id;
      }
    }
  
    if (!itemId) {
      console.log(`Item not found, creating new item: ${itemName}`);
      
      const fieldData = { name: itemName, ...additionalFields };
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
    }
  
    return itemId;
  };

  try {
    // Step 1: Check and publish country first, and get its ID
    console.log("About to enter task loop");
    console.log("Step 1: Processing country");
    const countryId = await getOrCreateItem('6511b5541b122aea972eaf8f', country);
    console.log(`Country ID: ${countryId}`);

    // Execute tasks
    let additionalFields = {};
    for (const taskName in taskConfig) {
      console.log(`Processing task: ${taskName}`);
      if (taskName === 'generateMetaTitle') {
        additionalFields['Meta Title'] = await generateMetaTitle(city);
      }
      // Add more tasks here as needed
    }

    // Step 2: Then check and publish city, linking it to the country
    console.log("Step 2: Processing city");
    const cityId = await getOrCreateItem('6511b5388842397b68f73aad', city, countryId, additionalFields);
    console.log(`City ID: ${cityId}`);

    console.log("Successfully processed both country and city");
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.log('Error:', JSON.stringify(error, null, 2));
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
