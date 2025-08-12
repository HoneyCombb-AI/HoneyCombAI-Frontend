const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzePerplexityDesign() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Perplexity Comet page...');
    await page.goto('https://www.perplexity.ai/comet', { waitUntil: 'networkidle' });
    
    // Wait a bit for any animations or dynamic content
    await page.waitForTimeout(3000);

    // Take full page screenshot
    console.log('Taking full page screenshot...');
    await page.screenshot({ 
      path: 'perplexity-full-page.png', 
      fullPage: true 
    });

    // Take viewport screenshot (above the fold)
    console.log('Taking viewport screenshot...');
    await page.screenshot({ 
      path: 'perplexity-viewport.png' 
    });

    // Analyze key elements
    console.log('Analyzing page elements...');
    
    // Get page title and meta description
    const pageTitle = await page.title();
    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    
    // Analyze navigation structure
    const navElements = await page.$$eval('nav, header [role="navigation"], .nav, .navigation', 
      elements => elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent.trim().substring(0, 200)
      }))
    );

    // Analyze heading hierarchy
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', 
      elements => elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim(),
        className: el.className,
        styles: getComputedStyle(el).fontSize + ' | ' + getComputedStyle(el).fontWeight + ' | ' + getComputedStyle(el).color
      }))
    );

    // Analyze main sections
    const sections = await page.$$eval('section, main, .section, [data-section]', 
      elements => elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        height: el.offsetHeight,
        textContent: el.textContent.trim().substring(0, 150) + '...'
      }))
    );

    // Analyze buttons and CTAs
    const buttons = await page.$$eval('button, .btn, [role="button"], a[class*="button"]', 
      elements => elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        text: el.textContent.trim(),
        href: el.href || null,
        styles: getComputedStyle(el).backgroundColor + ' | ' + getComputedStyle(el).color + ' | ' + getComputedStyle(el).borderRadius
      }))
    );

    // Get color scheme information
    const colorAnalysis = await page.evaluate(() => {
      const body = document.body;
      const bodyStyles = getComputedStyle(body);
      
      // Get root CSS variables if they exist
      const rootStyles = getComputedStyle(document.documentElement);
      const cssVariables = {};
      
      for (let i = 0; i < rootStyles.length; i++) {
        const prop = rootStyles[i];
        if (prop.startsWith('--')) {
          cssVariables[prop] = rootStyles.getPropertyValue(prop);
        }
      }
      
      return {
        backgroundColor: bodyStyles.backgroundColor,
        color: bodyStyles.color,
        fontFamily: bodyStyles.fontFamily,
        fontSize: bodyStyles.fontSize,
        lineHeight: bodyStyles.lineHeight,
        cssVariables: Object.keys(cssVariables).length > 0 ? cssVariables : 'None found'
      };
    });

    // Analyze spacing and layout
    const layoutAnalysis = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('div[class*="container"], .wrapper, main, [class*="max-w"]'));
      return containers.map(el => ({
        className: el.className,
        width: el.offsetWidth,
        padding: getComputedStyle(el).padding,
        margin: getComputedStyle(el).margin,
        maxWidth: getComputedStyle(el).maxWidth
      }));
    });

    const analysis = {
      pageTitle,
      metaDescription,
      timestamp: new Date().toISOString(),
      url: 'https://www.perplexity.ai/comet',
      navigation: navElements,
      headingHierarchy: headings,
      sections: sections,
      buttonsAndCTAs: buttons,
      colorScheme: colorAnalysis,
      layoutContainers: layoutAnalysis
    };

    // Save analysis to JSON file
    fs.writeFileSync('perplexity-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('Analysis complete! Files saved:');
    console.log('- perplexity-full-page.png (full page screenshot)');
    console.log('- perplexity-viewport.png (above the fold screenshot)');
    console.log('- perplexity-analysis.json (detailed analysis)');

    return analysis;

  } catch (error) {
    console.error('Error analyzing Perplexity page:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzePerplexityDesign()
  .then(analysis => {
    console.log('\n=== DESIGN ANALYSIS SUMMARY ===');
    console.log(`Page Title: ${analysis.pageTitle}`);
    console.log(`Headings Found: ${analysis.headingHierarchy.length}`);
    console.log(`Sections Found: ${analysis.sections.length}`);
    console.log(`Buttons/CTAs Found: ${analysis.buttonsAndCTAs.length}`);
    console.log(`Body Background: ${analysis.colorScheme.backgroundColor}`);
    console.log(`Body Font: ${analysis.colorScheme.fontFamily}`);
  })
  .catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });