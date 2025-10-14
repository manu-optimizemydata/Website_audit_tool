const express = require('express');
const BrevoService = require('../lib/brevoService');

const router = express.Router();
const brevoService = new BrevoService();

// Handle lead form submission
router.post('/submit-lead', async (req, res) => {
    try {
        const { name, email, phone, website } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !website) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Please provide name, email, phone, and website'
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
                message: 'Please provide a valid email address'
            });
        }

        // Basic phone validation (at least 10 digits)
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone format',
                message: 'Please provide a valid phone number'
            });
        }

        console.log('📧 Processing lead submission:', { name, email, phone, website });
        console.log('📧 Brevo service configured:', brevoService.isConfigured);

        // Prepare lead data
        const leadData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            website: website.trim()
        };

        console.log('📧 Calling brevoService.sendLeadEmail...');
        // Send lead notification email to manu@optimizemydata.com
        const leadResult = await brevoService.sendLeadEmail(leadData);
        console.log('📧 Lead result:', leadResult);
        
        // Send welcome email to the lead
        const welcomeResult = await brevoService.sendWelcomeEmail(leadData);

        console.log('✅ Lead processed successfully:', {
            leadEmail: leadResult.messageId,
            welcomeEmail: welcomeResult.messageId
        });

        res.json({
            success: true,
            message: 'Thank you! We\'ll contact you within 24 hours.',
            data: {
                leadEmailSent: leadResult.success,
                welcomeEmailSent: welcomeResult.success
            }
        });

    } catch (error) {
        console.error('❌ Lead submission error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to process lead',
            message: 'Something went wrong. Please try again or contact us directly.'
        });
    }
});

// Health check for lead service
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Lead Management Service'
    });
});

module.exports = router;
