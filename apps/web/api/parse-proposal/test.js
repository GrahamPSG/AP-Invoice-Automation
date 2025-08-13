// Test endpoint for OpenAI API configuration
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    const testData = {
      squareFootage: 45000,
      unitCount: 24,
      buildingType: 'multi-family',
      fixtures: {
        toilets: 48,
        sinks: 72,
        showers: 24,
        bathtubs: 24,
        floorDrains: 12,
      },
      hvac: {
        zones: 8,
        tonnage: 45,
        vents: 96,
      },
      rawText: 'Test data for PDF parsing endpoint',
    };

    return res.status(200).json({
      success: true,
      data: testData,
      message: 'Test parsing completed successfully',
      apiKeyConfigured: !!apiKey,
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}