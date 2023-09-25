// pages/api/city-input.js

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
    const getOrCreateItem = async (collectionId, itemName, relatedCountryId = null) => {
      console.log(`Fetching items for collection: ${collectionId}, itemName: ${itemName}`);
      
      let response = await fetch(`https://api.webflow.com/collections/${collectionId}/items?limit=1&name=${itemName}`, {
        headers: headers
      });
      let data = await response.json();
      console.log(`List items response for ${itemName}:`, JSON.stringify(data, null, 2));

      let itemId;
      if (!data.items || data.items.length === 0) {
        console.log(`Item ${itemName} not found. Creating new item.`);
        
        const fieldData = { name: itemName };
        if (relatedCountryId) {
          fieldData.country = relatedCountryId;
        }

        response = await fetch(`https://api.webflow.com/collections/${collectionId}/items`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            isArchived: false,
            isDraft: false,
            fieldData
          })
        });
        data = await response.json();
        console.log(`Create item response for ${itemName}:`, JSON.stringify(data, null, 2));
        itemId = data.id;

        // Publish the item
        console.log(`Publishing item ${itemName}`);
        
        response = await fetch(`https://api.webflow.com/collections/${collectionId}/items/publish`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            publishedItemIds: [itemId]
          })
        });
        data = await response.json();
        console.log(`Publish item response for ${itemName}:`, JSON.stringify(data, null, 2));
      } else {
        itemId = data.items[0].id;
      }

      return itemId;
    };

    // Check and publish country first, and get its ID
    console.log(`Processing country: ${country}`);
    const countryId = await getOrCreateItem('6511b5541b122aea972eaf8f', country);

    // Then check and publish city, linking it to the country
    console.log(`Processing city: ${city}`);
    await getOrCreateItem('6511b5388842397b68f73aad', city, countryId);

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.log('Error:', JSON.stringify(error, null, 2));
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
