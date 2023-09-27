// generateMetaTitle.js

import axios from 'axios';
import taskConfig from './taskConfig.json';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateMetaTitle(city) {
  const config = taskConfig.generateMetaTitle;
  const prompt = config.prompt.replace('{city}', city);

  try {
    const response = await axios.post(config.endpoint, {
      prompt,
      max_tokens: config.maxTokens,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.choices && response.data.choices[0]) {
      const metaTitle = response.data.choices[0].text.trim();
      console.log('OpenAI Response:', metaTitle);
      return metaTitle;
    } else {
      throw new Error('Invalid response from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    if (error.response) {
      console.error('Error Response:', JSON.stringify(error.response, null, 2));
    }
    throw error;
  }
}
