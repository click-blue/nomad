// pages/api/webflowOperations.js

import fetch from 'node-fetch';

const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;

// Function to check or create an item in Webflow
export async function checkOrCreateItem(collectionId, field, name, countryId = null) {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  
  // Check if item exists
  let response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
      'Accept': 'application/json'
    }
  });
  
  // Log the response from Webflow
  const responseJson = await response.json();
  console.log('Check Item Response:', responseJson);

  if (!response.ok) {
    const errorText = JSON.stringify(responseJson);
    throw new Error(`Webflow API request failed with status code ${response.status}: ${errorText}`);
  }

  const existingItems = responseJson;
  const existingItem = existingItems.items.find(item => item.slug === slug);

  // If item exists, return its ID
  if (existingItem) {
    return existingItem._id;
  }

  // Create a new item
  const fieldData = { [field]: name, slug };
  if (countryId) fieldData['country'] = countryId;  

  response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ fieldData })
  });

  // Log the response from Webflow
  const postResponseJson = await response.json();
  console.log('Post Item Response:', postResponseJson);

  if (!response.ok) {
    const errorText = JSON.stringify(postResponseJson);
    throw new Error(`Webflow API request failed with status code ${response.status}: ${errorText}`);
  }

  const newItem = postResponseJson;
  return newItem._id;
}

