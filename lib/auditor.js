const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const axios = require('axios');
const cheerio = require('cheerio');

class WebsiteAuditor {
  constructor() {
    this.browser = null;
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      try {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--no-first-run',
            '--no-default-browser-check'
          ],
          timeout: 30000,
          protocolTimeout: 30000
        });
        this.initialized = true;
        console.log('Browser initialized successfully');
      } catch (error) {
        console.error('Failed to initialize browser:', error);
        // Try alternative launch options
        try {
          this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
              '--no-sandbox', 
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--disable-extensions',
              '--no-first-run',
              '--no-default-browser-check'
            ],
            timeout: 30000,
            protocolTimeout: 30000
          });
          this.initialized = true;
          console.log('Browser initialized with fallback options');
        } catch (fallbackError) {
          console.error('Fallback browser initialization failed:', fallbackError);
          throw new Error('Unable to initialize browser');
        }
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async auditWebsite(url) {
    try {
      console.log(`Starting audit for: ${url}`);
      
      // Ensure browser is initialized
      await this.init();
      
      const results = {
        url,
        timestamp: new Date().toISOString(),
        performance: {},
        seo: {},
        accessibility: {},
        crawlability: {},
        overallScore: 0,
        recommendations: []
      };

      // Run all audits in parallel for better performance
      const [performanceResults, seoResults, accessibilityResults, crawlabilityResults] = await Promise.all([
        this.auditPerformance(url),
        this.auditSEO(url),
        this.auditAccessibility(url),
        this.auditCrawlability(url)
      ]);

      results.performance = performanceResults;
      results.seo = seoResults;
      results.accessibility = accessibilityResults;
      results.crawlability = crawlabilityResults;

      // Calculate overall score
      results.overallScore = this.calculateOverallScore(results);
      
      // Generate recommendations
      results.recommendations = this.generateRecommendations(results);

      return results;
    } catch (error) {
      console.error('Audit failed:', error);
      throw new Error(`Audit failed: ${error.message}`);
    }
  }

  async auditPerformance(url) {
    try {
      await this.init();
      
      if (!this.browser) {
        throw new Error('Browser not available');
      }
      
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Get Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};
          
          // LCP
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // FID
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              vitals.fid = entry.processingStart - entry.startTime;
            });
          }).observe({ entryTypes: ['first-input'] });

          // CLS
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => resolve(vitals), 3000);
        });
      });

      // Get additional performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });

      await page.close();

      return {
        coreWebVitals: vitals,
        metrics,
        score: this.calculatePerformanceScore(vitals, metrics)
      };
    } catch (error) {
      console.error('Performance audit failed:', error);
      return { error: error.message, score: 0 };
    }
  }

  async auditSEO(url) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      const seoChecks = {
        title: {
          present: $('title').length > 0,
          content: $('title').text().trim(),
          length: $('title').text().trim().length,
          optimal: $('title').text().trim().length >= 30 && $('title').text().trim().length <= 60
        },
        metaDescription: {
          present: $('meta[name="description"]').length > 0,
          content: $('meta[name="description"]').attr('content') || '',
          length: ($('meta[name="description"]').attr('content') || '').length,
          optimal: ($('meta[name="description"]').attr('content') || '').length >= 120 && ($('meta[name="description"]').attr('content') || '').length <= 160
        },
        headings: {
          h1: $('h1').length,
          h2: $('h2').length,
          h3: $('h3').length,
          h4: $('h4').length,
          h5: $('h5').length,
          h6: $('h6').length,
          hasH1: $('h1').length > 0,
          multipleH1: $('h1').length > 1
        },
        images: {
          total: $('img').length,
          withAlt: $('img[alt]').length,
          withoutAlt: $('img:not([alt])').length,
          altTextCoverage: $('img').length > 0 ? ($('img[alt]').length / $('img').length) * 100 : 100
        },
        links: {
          total: $('a').length,
          internal: $('a[href^="/"], a[href*="' + new URL(url).hostname + '"]').length,
          external: $('a[href^="http"]:not([href*="' + new URL(url).hostname + '"])').length,
          withTitle: $('a[title]').length
        },
        structuredData: {
          jsonLd: $('script[type="application/ld+json"]').length,
          microdata: $('[itemscope]').length,
          rdfa: $('[typeof]').length
        },
        robots: {
          metaRobots: $('meta[name="robots"]').attr('content') || '',
          robotsTxt: null // Will be checked separately
        },
        sitemap: {
          present: $('link[rel="sitemap"]').length > 0,
          url: $('link[rel="sitemap"]').attr('href') || ''
        }
      };

      // Check robots.txt
      try {
        const robotsResponse = await axios.get(new URL('/robots.txt', url).href);
        seoChecks.robots.robotsTxt = robotsResponse.data;
      } catch (error) {
        seoChecks.robots.robotsTxt = 'Not found';
      }

      return {
        ...seoChecks,
        score: this.calculateSEOScore(seoChecks)
      };
    } catch (error) {
      console.error('SEO audit failed:', error);
      return { error: error.message, score: 0 };
    }
  }

  async auditAccessibility(url) {
    try {
      await this.init();
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Run accessibility audit using Puppeteer
      const accessibilityResults = await page.evaluate(() => {
        const issues = [];
        let score = 100;

        // Check for alt text on images
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
          issues.push({
            type: 'error',
            message: `${imagesWithoutAlt.length} images missing alt text`,
            elements: Array.from(imagesWithoutAlt).map(img => img.src || 'unknown')
          });
          score -= imagesWithoutAlt.length * 5;
        }

        // Check for proper heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.substring(1)));
        let previousLevel = 0;
        let structureIssues = 0;

        headingLevels.forEach(level => {
          if (level > previousLevel + 1) {
            structureIssues++;
          }
          previousLevel = level;
        });

        if (structureIssues > 0) {
          issues.push({
            type: 'warning',
            message: 'Heading structure may skip levels',
            count: structureIssues
          });
          score -= structureIssues * 3;
        }

        // Check for form labels
        const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        const inputsWithLabels = Array.from(inputsWithoutLabels).filter(input => {
          const label = document.querySelector(`label[for="${input.id}"]`);
          return !label;
        });

        if (inputsWithLabels.length > 0) {
          issues.push({
            type: 'error',
            message: `${inputsWithLabels.length} form inputs missing labels`,
            count: inputsWithLabels.length
          });
          score -= inputsWithLabels.length * 8;
        }

        // Check for color contrast (simplified)
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        let contrastIssues = 0;
        
        textElements.forEach(element => {
          const style = window.getComputedStyle(element);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          // This is a simplified check - in a real implementation, you'd use a proper contrast ratio calculation
          if (color === backgroundColor) {
            contrastIssues++;
          }
        });

        if (contrastIssues > 0) {
          issues.push({
            type: 'warning',
            message: `${contrastIssues} potential color contrast issues`,
            count: contrastIssues
          });
          score -= contrastIssues * 2;
        }

        return {
          issues,
          score: Math.max(0, score),
          totalElements: document.querySelectorAll('*').length
        };
      });

      await page.close();

      return accessibilityResults;
    } catch (error) {
      console.error('Accessibility audit failed:', error);
      return { error: error.message, score: 0 };
    }
  }

  async auditCrawlability(url) {
    try {
      await this.init();
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const crawlabilityResults = await page.evaluate(() => {
        const issues = [];
        let score = 100;

        // Check for JavaScript-only content
        const scripts = document.querySelectorAll('script');
        const hasContent = document.body.innerText.trim().length > 0;
        
        if (scripts.length > 0 && !hasContent) {
          issues.push({
            type: 'error',
            message: 'Page appears to be JavaScript-only with no visible content',
            severity: 'high'
          });
          score -= 30;
        }

        // Check for proper meta tags
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          issues.push({
            type: 'warning',
            message: 'Missing viewport meta tag',
            severity: 'medium'
          });
          score -= 10;
        }

        // Check for canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
          issues.push({
            type: 'warning',
            message: 'Missing canonical URL',
            severity: 'medium'
          });
          score -= 5;
        }

        // Check for proper URL structure
        const currentUrl = window.location.href;
        if (currentUrl.includes('#')) {
          issues.push({
            type: 'info',
            message: 'URL contains hash fragments',
            severity: 'low'
          });
          score -= 2;
        }

        return {
          issues,
          score: Math.max(0, score),
          url: currentUrl,
          hasContent: hasContent,
          scriptCount: scripts.length
        };
      });

      await page.close();

      return crawlabilityResults;
    } catch (error) {
      console.error('Crawlability audit failed:', error);
      return { error: error.message, score: 0 };
    }
  }

  calculatePerformanceScore(vitals, metrics) {
    let score = 100;

    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    if (vitals.lcp > 4000) score -= 30;
    else if (vitals.lcp > 2500) score -= 15;

    // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (vitals.fid > 300) score -= 25;
    else if (vitals.fid > 100) score -= 10;

    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (vitals.cls > 0.25) score -= 20;
    else if (vitals.cls > 0.1) score -= 10;

    // Additional metrics
    if (metrics.domContentLoaded > 3000) score -= 10;
    if (metrics.loadComplete > 5000) score -= 10;

    return Math.max(0, score);
  }

  calculateSEOScore(seoChecks) {
    let score = 100;

    // Title checks
    if (!seoChecks.title.present) score -= 20;
    else if (!seoChecks.title.optimal) score -= 10;

    // Meta description checks
    if (!seoChecks.metaDescription.present) score -= 15;
    else if (!seoChecks.metaDescription.optimal) score -= 5;

    // Heading checks
    if (!seoChecks.headings.hasH1) score -= 15;
    if (seoChecks.headings.multipleH1) score -= 10;

    // Image alt text
    if (seoChecks.images.altTextCoverage < 80) score -= 15;

    // Structured data bonus
    if (seoChecks.structuredData.jsonLd > 0) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  calculateOverallScore(results) {
    const weights = {
      performance: 0.3,
      seo: 0.3,
      accessibility: 0.2,
      crawlability: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach(category => {
      if (results[category] && typeof results[category].score === 'number') {
        totalScore += results[category].score * weights[category];
        totalWeight += weights[category];
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Performance recommendations
    if (results.performance.score < 70) {
      recommendations.push({
        category: 'Performance',
        priority: 'high',
        message: 'Improve Core Web Vitals - focus on LCP, FID, and CLS',
        details: 'Consider optimizing images, reducing JavaScript execution time, and minimizing layout shifts'
      });
    }

    // SEO recommendations
    if (results.seo.score < 70) {
      if (!results.seo.title.present) {
        recommendations.push({
          category: 'SEO',
          priority: 'high',
          message: 'Add a title tag to your page',
          details: 'Title tags are crucial for SEO and should be 30-60 characters long'
        });
      }
      if (!results.seo.metaDescription.present) {
        recommendations.push({
          category: 'SEO',
          priority: 'medium',
          message: 'Add a meta description',
          details: 'Meta descriptions should be 120-160 characters and describe your page content'
        });
      }
    }

    // Accessibility recommendations
    if (results.accessibility.score < 70) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'high',
        message: 'Improve accessibility compliance',
        details: 'Focus on alt text for images, proper heading structure, and form labels'
      });
    }

    // Crawlability recommendations
    if (results.crawlability.score < 70) {
      recommendations.push({
        category: 'Crawlability',
        priority: 'medium',
        message: 'Improve page crawlability',
        details: 'Ensure content is accessible without JavaScript and add proper meta tags'
      });
    }

    return recommendations;
  }
}

module.exports = WebsiteAuditor;
