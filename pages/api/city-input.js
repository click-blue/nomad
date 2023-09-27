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
    try {
      let itemId = null;
  
      // Check if the item already exists
      let response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
        headers: headers
      });
  
      if (response.status !== 200) {
        throw new Error(`Webflow API request failed with status code ${response.status}`);
      }
  
      let data = await response.json();
  
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
  
        // Create the item
        response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            isArchived: false,
            isDraft: false,
            fieldData
          })
        });
  
        if (response.status !== 202) {
          throw new Error(`Webflow API request failed when creating item with status code ${response.status}`);
        }

        // Get itemId from the response
        data = await response.json();
        itemId = data._id;
  
        // Poll for item creation completion
        let creationCompleted = false;
        while (!creationCompleted) {
          // Make a request to check the item's status
          response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`, {
            headers: headers
          });
  
          if (response.status === 200) {
            // Item creation is complete
            creationCompleted = true;
          } else if (response.status !== 202) {
            // An error occurred during polling
            throw new Error(`Webflow API request failed during polling with status code ${response.status}`);
          }
  
          // Wait for a moment before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
  
        // Publish the item once creation is complete
        response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/publish`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            publishedItemIds: [itemId]
          })
        });
  
        if (response.status !== 200) {
          throw new Error(`Webflow API request failed when publishing item with status code ${response.status}`);
        }
  
        await response.json();
      }
  
      return itemId;
    } catch (error) {
      console.error('Webflow API Error:', error.message);
      throw error;
    }
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
    console.error('Error:', error.message);
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
