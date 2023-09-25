// pages/api/city-input.js

// Load environment variables
const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { city, country } = req.body;

  const headers = {
    'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept-Version': '1.0.0'
  };

  try {
    // Search for country in the countries collection
    let response = await fetch(`https://api.webflow.com/collections/6511b5541b122aea972eaf8f/items?limit=1&name=${country}`, {
      headers: headers
    });
    let data = await response.json();

    // If country doesn't exist, create it
    if (!data.items || data.items.length === 0) {
      await fetch(`https://api.webflow.com/collections/6511b5541b122aea972eaf8f/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ name: country })
      });
    }

    // Search for city in the cities collection
    response = await fetch(`https://api.webflow.com/collections/6511b5388842397b68f73aad/items?limit=1&name=${city}`, {
      headers: headers
    });
    data = await response.json();

    // If city doesn't exist, create it
    if (!data.items || data.items.length === 0) {
      await fetch(`https://api.webflow.com/collections/6511b5388842397b68f73aad/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ name: city })
      });
    }

    // If everything is successful, return a success status
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    // If there's an error, return an error status
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
