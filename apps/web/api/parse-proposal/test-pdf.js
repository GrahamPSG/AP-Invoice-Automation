// Test PDF endpoint for file upload testing
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Simulate OpenAI parsing with the test construction plan data
    const simulatedData = {
      squareFootage: 105010,
      unitCount: 141,
      buildingType: 'multi-family',
      fixtures: {
        toilets: 169,
        sinks: 211 + 141, // lavatories + kitchen sinks
        showers: 113,
        bathtubs: 85,
        floorDrains: 48,
      },
      hvac: {
        zones: 141,
        tonnage: 282,
        vents: 705 + 282, // supply + return
      },
      rawText: 'Simulated extraction from uploaded PDF file',
    };

    return res.status(200).json({
      success: true,
      data: simulatedData,
      fileName: 'test.pdf',
      fileSize: 0,
      message: apiKey ? 'Test PDF parsing with API key configured' : 'Test PDF parsing (no API key)',
      apiKeyConfigured: !!apiKey
    });

  } catch (error) {
    console.error('Error in test-pdf endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}