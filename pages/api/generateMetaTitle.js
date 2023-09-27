// pages/api/generateMetaTitle.js

import axios from 'axios';
import taskConfig from './taskConfig.json';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateMetaTitle(city) {
  const config = taskConfig.generateMetaTitle;
  const prompt = config.prompt.replace('{city}', city);

  try {
    const response = await axios.post(config.endpoint, {
      prompt: prompt,
      max_tokens: config.maxTokens
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('OpenAI response:', JSON.stringify(response.data, null, 2));
    const generatedTitle = response.data.choices[0].text.trim();
    return generatedTitle;
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    throw error;
  }
}
