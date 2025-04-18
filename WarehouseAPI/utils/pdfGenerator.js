import puppeteer from 'puppeteer';
import { generateOvertimeTemplate } from '../templates/employeeOvertimePDFTemplate.js';
import { generateLeaveTemplate } from '../templates/employeeLeavePDFTemplate.js';
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
    
    // 验证PDF是否有效
    if (!pdf || pdf.length === 0) {
      throw new Error('生成的PDF为空或无效');
    }
    
    // 9. Close browser
    console.log('PDF generation successful, closing browser...');
    await browser.close();
    browser = null;
    
    console.log('PDF generation completed, buffer size:', pdf.length);
    // 记录PDF的前20个字节，用于调试
    console.log('PDF header bytes:', pdf.slice(0, 20).toString('hex'));
    
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
 * @param {Buffer|Uint8Array} pdfBuffer - PDF file buffer or Uint8Array
 * @param {string} filename - Download filename
 */
export function sendPDFResponse(res, pdfBuffer, filename) {
  // 确保Buffer有效 - 支持Buffer和Uint8Array
  if (!pdfBuffer || pdfBuffer.length === 0) {
    console.error('无效的PDF缓冲区', pdfBuffer);
    res.status(500).json({ success: false, msg: '生成的PDF无效' });
    return;
  }
  
  // 如果是Uint8Array但不是Buffer，转换为Buffer
  const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  
  console.log(`发送PDF响应: ${filename}, 大小: ${buffer.length} 字节`);
  
  // 设置响应头和发送PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // 发送PDF数据
  res.end(buffer, 'binary');
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
 * @param {Object} pdfData - PDF data object containing customer and orders info
 */
export async function generateCustomerOrdersPDF(req, res, pdfData) {
  try {
    const data = pdfData || req.body;
    
    if (!data.customer || !data.orders) {
      return res.status(400).json({ error: '缺少必要数据：customer和orders字段是必需的' });
    }
    
    // 从查询参数获取未付款金额和显示设置
    const showUnpaid = req.query.showUnpaid === 'true';
    const unpaidAmount = req.query.unpaidAmount ? parseFloat(req.query.unpaidAmount) : 0;
    
    console.log(`PDF生成参数: showUnpaid=${showUnpaid}, unpaidAmount=${unpaidAmount}`);
    
    // 如果前端传递了unpaidAmount，使用它替换data中的值
    if (req.query.unpaidAmount) {
      data.totalUnpaid = unpaidAmount;
    }
    
    // 确保showUnpaid参数被正确应用
    data.showUnpaid = showUnpaid;
    
    console.log('开始生成客户订单PDF...');
    const pdfBuffer = await generatePDF(data, 'customerOrders');
    console.log('PDF生成完成，大小:', pdfBuffer.length);
    
    // Set filename: Customer_[CustomerName]_Orders_[Date].pdf
    const customerName = data.customer.name || 'Unknown';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Customer_${customerName.replace(/\s+/g, '_')}_Orders_${date}.pdf`;
    
    // 使用封装的响应函数
    sendPDFResponse(res, pdfBuffer, filename);
  } catch (error) {
    console.error('生成客户订单PDF时出错:', error);
    res.status(500).json({ error: '生成PDF时发生错误', details: error.message });
  }
} 