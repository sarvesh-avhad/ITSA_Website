import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import QRCode from 'qrcode';
import { InternalError } from '@/lib/errors';
import logger from '@/lib/logger';
import { documentConversionService } from '@/modules/certificates/document-conversion.service';

/**
 * Generates a base64 string or Buffer of a QR Code for the given URL
 */
async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    QRCode.toBuffer(url, { errorCorrectionLevel: 'H', margin: 1 }, (err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
}

/**
 * Extracts placeholders from a PPTX template buffer
 */
export function extractPlaceholders(templateBuffer: Buffer): string[] {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '<<', end: '>>' },
      modules: []
    });

    // The official way to get variables in newer docxtemplater:
    // This requires compiling and then getting the structured variables.
    // For simplicity, we can do a regex across the raw XML of slides, but docxtemplater is safer.
    // However, docxtemplater provides an inspect module or we can just parse the slide xml.
    
    // A much safer raw extraction using PizZip:
    const placeholders = new Set<string>();
    const files = zip.file(/ppt\/slides\/slide\d+\.xml/);
    
    const placeholderRegex = /&lt;&lt;(.*?)&gt;&gt;/g;
    const cleanPlaceholderRegex = /<<(.*?)>>/g;

    files.forEach((file: any) => {
      const content = file.asText();
      
      // Sometimes PPTX XML uses escaped brackets
      let match;
      while ((match = placeholderRegex.exec(content)) !== null) {
        // Strip XML tags inside the placeholder if it was split
        const clean = match[1].replace(/<[^>]+>/g, '').trim();
        if (clean) placeholders.add(clean);
      }
      
      while ((match = cleanPlaceholderRegex.exec(content)) !== null) {
        const clean = match[1].replace(/<[^>]+>/g, '').trim();
        if (clean) placeholders.add(clean);
      }
    });

    return Array.from(placeholders);
  } catch (error: any) {
    logger.error(`Failed to extract placeholders: ${error.message}`);
    throw new InternalError('Failed to parse certificate template.');
  }
}

/**
 * Fills a PPTX template and returns a PDF buffer
 */
export async function generateCertificatePdf(
  templateBuffer: Buffer,
  data: Record<string, string>,
  qrUrl?: string
): Promise<Buffer> {
  try {
    const zip = new PizZip(templateBuffer);

    // Setup image module for QR Code injection
    // If qrUrl is provided and the template has {%qrCode}, it will render the QR
    const imageOptions = {
      centered: false,
      getImage: async (tagValue: string, tagName: string) => {
        if (tagName === 'qrCode' && qrUrl) {
           return await generateQRCodeBuffer(qrUrl);
        }
        // Return a transparent 1x1 png if no image
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      },
      getSize: (img: any, tagValue: string, tagName: string) => {
        if (tagName === 'qrCode') {
          return [150, 150]; // 150px x 150px
        }
        return [100, 100];
      }
    };

    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '<<', end: '>>' },
      modules: [imageModule]
    });

    // We must resolve images asynchronously in newer versions, 
    // but the free module usually resolves synchronously if passed a buffer. 
    // To support async `getImage`, we must use `resolveData`.
    await doc.resolveData({ ...data, qrCode: qrUrl || 'no-qr' });
    
    doc.render();

    const generatedPptxBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Now convert the generated PPTX to PDF using the conversion service
    const pdfBuffer = await documentConversionService.convertToPdf(generatedPptxBuffer, 'certificate_temp.pptx');
    
    return pdfBuffer;
  } catch (error: any) {
    logger.error(`Certificate Generation Error: ${error.message}`);
    throw new InternalError('Failed to generate certificate PDF.');
  }
}
