// pages/api/city-input.js

import fetch from 'node-fetch';

const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;
const headers = {
  'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { city, country } = req.body;
  if (!country) return res.status(400).json({ status: 'failed', error: 'Country name is required' });

  try {
    const collectionId = '6511b5541b122aea972eaf8f';
    const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        isArchived: false,
        isDraft: false,
        fieldData: { name: country }
      })
    });

    const data = await response.json();
    return response.ok 
      ? res.status(200).json({ status: 'success', data }) 
      : res.status(400).json({ status: 'failed', error: data });
  } catch (error) {
    console.error('Error:', JSON.stringify(error, null, 2));
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
