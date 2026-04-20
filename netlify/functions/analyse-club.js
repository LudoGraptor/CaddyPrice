exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { images, clubDetails } = JSON.parse(event.body);

    const imageContent = images.map(img => ({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType,
        data: img.base64
      }
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text",
              text: `You are an expert golf club valuation assistant. Analyse these photos and details to provide a comprehensive valuation.

Club Details:
${clubDetails}

Respond ONLY with a valid JSON object in exactly this format, no other text:
{
  "clubName": "Full club name e.g. TaylorMade P790 Iron Set",
  "type": "Club type",
  "year": "Year or era",
  "brand": "Brand name",
  "model": "Model name",
  "condition": {
    "overall": "Excellent/Very Good/Good/Fair/Poor",
    "score": 8,
    "faceCondition": "Brief description",
    "shaftCondition": "Brief description",
    "gripCondition": "Brief description",
    "cosmeticNotes": "Brief description"
  },
  "pricing": {
    "recommendedListingPrice": 250,
    "priceRangeLow": 200,
    "priceRangeHigh": 300,
    "pricingRationale": "Brief explanation of pricing"
  },
  "analysis": "2-3 sentence overall assessment",
  "comparableSales": [
    {"title": "Similar club sold", "platform": "eBay", "price": 245, "daysAgo": 14},
    {"title": "Similar club sold", "platform": "Facebook", "price": 220, "daysAgo": 21}
  ],
  "listingTips": [
    "Tip 1 for getting best price",
    "Tip 2 for getting best price",
    "Tip 3 for getting best price"
  ]
}`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || 'Analysis failed' })
    };
  }
};
