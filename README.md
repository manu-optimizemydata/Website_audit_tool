# Website Audit Tool

A comprehensive website audit tool that analyzes websites for performance, SEO, accessibility, and crawlability to determine if they are Google-friendly.

## Features

### 🚀 Performance Analysis
- **Core Web Vitals**: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)
- **Additional Metrics**: DOM Content Loaded, Load Complete, First Paint, First Contentful Paint
- **Performance Scoring**: Based on Google's Core Web Vitals thresholds

### 🔍 SEO Analysis
- **Title Tags**: Presence, length, and optimization
- **Meta Descriptions**: Presence, length, and optimization
- **Heading Structure**: H1-H6 analysis and hierarchy
- **Image Optimization**: Alt text coverage and optimization
- **Link Analysis**: Internal/external links, title attributes
- **Structured Data**: JSON-LD, Microdata, RDFa detection
- **Robots.txt**: Analysis and validation
- **Sitemap**: Detection and validation

### ♿ Accessibility Analysis
- **Alt Text**: Missing alt attributes on images
- **Heading Structure**: Proper heading hierarchy
- **Form Labels**: Missing labels on form inputs
- **Color Contrast**: Basic contrast ratio analysis
- **Accessibility Scoring**: Based on WCAG guidelines

### 🕷️ Crawlability Analysis
- **JavaScript Content**: Detection of JS-only content
- **Meta Tags**: Viewport, canonical URL analysis
- **URL Structure**: Hash fragments and clean URLs
- **Content Accessibility**: Ensuring content is crawlable

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SEO_Tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

1. **Enter a URL**: Input the website URL you want to audit
2. **Start Audit**: Click the "Start Audit" button
3. **View Results**: Review the comprehensive analysis including:
   - Overall score (0-100)
   - Category-specific scores
   - Detailed metrics and findings
   - Actionable recommendations

## API Endpoints

### POST `/api/audit/analyze`
Analyzes a website and returns comprehensive audit results.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "overallScore": 85,
    "performance": {
      "coreWebVitals": {
        "lcp": 1200,
        "fid": 50,
        "cls": 0.05
      },
      "score": 90
    },
    "seo": {
      "title": {
        "present": true,
        "optimal": true,
        "length": 45
      },
      "score": 85
    },
    "accessibility": {
      "issues": [],
      "score": 95
    },
    "crawlability": {
      "hasContent": true,
      "score": 80
    },
    "recommendations": [
      {
        "category": "Performance",
        "priority": "medium",
        "message": "Optimize images for faster loading",
        "details": "Consider using WebP format and proper compression"
      }
    ]
  }
}
```

### GET `/api/audit/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Website Audit Tool"
}
```

## Scoring System

### Overall Score Calculation
- **Performance**: 30% weight
- **SEO**: 30% weight
- **Accessibility**: 20% weight
- **Crawlability**: 20% weight

### Score Ranges
- **90-100**: Excellent
- **70-89**: Good
- **50-69**: Needs Improvement
- **0-49**: Poor

## Technology Stack

- **Backend**: Node.js, Express.js
- **Web Scraping**: Puppeteer, Axios, Cheerio
- **Performance Analysis**: Custom Core Web Vitals implementation
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Modern CSS with gradients and animations

## Dependencies

- `express`: Web framework
- `puppeteer`: Headless Chrome automation
- `lighthouse`: Performance auditing
- `axios`: HTTP client
- `cheerio`: Server-side jQuery implementation
- `cors`: Cross-origin resource sharing
- `helmet`: Security middleware
- `compression`: Gzip compression

## Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
Create a `.env` file:
```
PORT=3000
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub or contact the development team.

---

**Note**: This tool is designed for educational and development purposes. Always respect website terms of service and robots.txt files when performing audits.
