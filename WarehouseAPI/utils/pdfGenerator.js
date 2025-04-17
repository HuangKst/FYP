import puppeteer from 'puppeteer';
import { generateOvertimeTemplate } from '../templates/employeeOvertimePDFTemplate.js';
import { generateLeaveTemplate } from '../templates/employeeLeaveimePDFTemplate.js';
import { generateOrderTemplate } from '../templates/orderPDFTemplate.js';
import { generateCustomerOrdersTemplate } from '../templates/orderByCustomerPDFTemplate.js';

/**
 * Universal PDF Generation Tool - Convert data objects to PDF documents
 * 
 * @param {Object} data - Data object to be passed to the template function
 * @param {string} type - Document type ('overtime', 'leave', 'order', 'customerOrders')
 * @returns {Promise<Buffer>} - Returns PDF file buffer
 */
export async function generatePDF(data, type) {
  let browser = null;
  try {
    console.log(`Starting to generate ${type} PDF...`);
    
    // 1. Get the corresponding template based on type
    let templateHtml;
    switch (type) {
      case 'overtime':
        templateHtml = generateOvertimeTemplate(data);
        break;
      case 'leave':
        templateHtml = generateLeaveTemplate(data);
        break;
      case 'order':
        templateHtml = generateOrderTemplate(data);
        break;
      case 'customerOrders':
        templateHtml = generateCustomerOrdersTemplate(data);
        break;
      default:
        throw new Error(`Unsupported template type: ${type}`);
    }
    
    console.log('HTML template created');
    
    // 2. Configure Puppeteer options
    const puppeteerOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--font-render-hinting=none'
      ],
      timeout: 60000
    };
    
    // 3. Launch browser and create new page
    console.log('Launching Puppeteer browser...');
    browser = await puppeteer.launch(puppeteerOptions);
    
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // 4. Set viewport size to A4
    await page.setViewport({
      width: 794, // A4 width in pixels (72dpi)
      height: 1123, // A4 height in pixels
      deviceScaleFactor: 1
    });
    
    // 5. Set page content
    console.log('Setting page content...');
    await page.setContent(templateHtml, { 
      waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
      timeout: 30000
    });
    
    // 6. Ensure all fonts are loaded
    await page.evaluate(() => document.fonts.ready);
    
    // 7. Set print media type
    await page.emulateMediaType('print');
    
    // 8. Generate PDF
    console.log('Generating PDF...');
    const pdf = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      scale: 0.98
    });
    
    // 9. Close browser
    console.log('PDF generation successful, closing browser...');
    await browser.close();
    browser = null;
    
    console.log('PDF generation completed, buffer size:', pdf.length);
    return pdf;
  } catch (error) {
    console.error('PDF generation failed:', error);
    // Ensure browser instance is closed
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Failed to close browser:', closeError);
      }
    }
    throw error;
  }
}

/**
 * Send generated PDF to client
 * 
 * @param {Object} res - Express response object
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} filename - Download filename
 */
export function sendPDFResponse(res, pdfBuffer, filename) {
  // Set response headers and send PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
}

/**
 * Handle errors in PDF generation process
 * 
 * @param {Object} res - Express response object
 * @param {Error} error - Caught error object
 */
export function handlePDFError(res, error) {
  console.error('Error generating PDF:', error);
  res.status(500).json({ 
    success: false, 
    msg: 'Failed to generate PDF', 
    error: error.message 
  });
}

/**
 * Generate customer orders PDF and send response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateCustomerOrdersPDF(req, res) {
  try {
    const data = req.body;
    
    if (!data.customer || !data.orders) {
      return res.status(400).json({ error: '缺少必要数据：customer和orders字段是必需的' });
    }
    
    const pdfBuffer = await generatePDF(data, 'customerOrders');
    
    // Set filename: Customer_[CustomerName]_Orders_[Date].pdf
    const customerName = data.customer.name || 'Unknown';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Customer_${customerName.replace(/\s+/g, '_')}_Orders_${date}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('生成客户订单PDF时出错:', error);
    res.status(500).json({ error: '生成PDF时发生错误', details: error.message });
  }
}

module.exports = {
  generatePDF,
  sendPDFResponse,
  handlePDFError,
  generateCustomerOrdersPDF
}; 