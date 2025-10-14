const express = require('express');
const SimpleWebsiteAuditor = require('../lib/simpleAuditor');

const router = express.Router();
const simpleAuditor = new SimpleWebsiteAuditor();

router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a valid URL to analyze'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL (e.g., https://example.com)'
      });
    }

    console.log(`Starting audit for: ${url}`);
    
    let results;
    // Skip full audit due to Puppeteer issues, go straight to simple audit
    try {
      console.log('Using simple audit (Puppeteer disabled)');
      results = await simpleAuditor.auditWebsite(url);
      console.log('Simple audit completed successfully');
    } catch (simpleError) {
      console.error('Simple audit failed:', simpleError.message);
      throw new Error('Unable to perform audit. Please try again later.');
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({
      error: 'Audit failed',
      message: error.message || 'An unexpected error occurred during the audit'
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Website Audit Tool'
  });
});

module.exports = router;
