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

  try {
    const createCountryItem = async () => {
      const collectionId = 'Your_Countries_Collection_ID_Here'; // Replace with your actual Collection ID for countries
      const fieldData = { name: country };

      const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          isArchived: false,
          isDraft: false,
          fieldData
        })
      });

      const data = await response.json();
      if (response.ok) {
        return res.status(200).json({ status: 'success', data });
      } else {
        return res.status(400).json({ status: 'failed', error: data });
      }
    };

    await createCountryItem();
  } catch (error) {
    console.log('Error:', JSON.stringify(error, null, 2));
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
