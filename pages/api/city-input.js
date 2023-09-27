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
    // Check if country exists
    let response = await fetch(`https://api.webflow.com/v2/collections/6511b5541b122aea972eaf8f/items?query=${country}`, {
      headers: headers,
    });
    let data = await response.json();
    let countryItemId;
    if (data.items && data.items.length > 0) {
      countryItemId = data.items[0]._id;  // Assuming the country name is unique
    } else {
      // Create country
      response = await fetch(`https://api.webflow.com/v2/collections/6511b5541b122aea972eaf8f/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          fieldData: {
            name: country,
            slug: country.toLowerCase().replace(/\s+/g, '-')
          }
        })
      });
      data = await response.json();
      countryItemId = data._id;
    }

    // Generate Meta Title
    const metaTitle = await generateMetaTitle(city);

    // Check if city exists
    response = await fetch(`https://api.webflow.com/v2/collections/6511b5388842397b68f73aad/items?query=${city}`, {
      headers: headers,
    });
    data = await response.json();
    let cityItemId;
    if (data.items && data.items.length > 0) {
      cityItemId = data.items[0]._id;  // Assuming the city name is unique
    } else {
      // Create city
      response = await fetch(`https://api.webflow.com/v2/collections/6511b5388842397b68f73aad/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          fieldData: {
            name: city,
            slug: city.toLowerCase().replace(/\s+/g, '-'),
            'Meta Title': metaTitle,
            'Country': countryItemId  // Assuming there's a reference field to link the city to the country
          }
        })
      });
      data = await response.json();
      cityItemId = data._id;
    }

    // Update city with additional fields if necessary
    // (assuming you might have additional fields to update later on)
    // if (additionalFields) {
    //   await fetch(`https://api.webflow.com/v2/collections/6511b5388842397b68f73aad/items/${cityItemId}`, {
    //     method: 'PATCH',
    //     headers: headers,
    //     body: JSON.stringify({ fieldData: additionalFields })
    //   });
    // }

    return res.status(200).json({ status: 'success' });

  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
