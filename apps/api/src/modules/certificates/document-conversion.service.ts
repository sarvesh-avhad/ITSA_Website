import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, readFile, unlink, mkdtemp, rm } from 'fs/promises';
import { InternalError } from '@/lib/errors';
import logger from '@/lib/logger';

export interface IDocumentConversionService {
  convertToPdf(inputBuffer: Buffer, originalFilename: string): Promise<Buffer>;
}

export class LibreOfficeConversionService implements IDocumentConversionService {
  private readonly libreOfficePath: string;

  constructor() {
    // Determine the LibreOffice binary path based on OS.
    // This is configurable, falling back to typical default locations.
    this.libreOfficePath = process.env.LIBREOFFICE_PATH || this.getDefaultPath();
  }

  private getDefaultPath(): string {
    switch (process.platform) {
      case 'win32':
        return 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
      case 'darwin':
        return '/Applications/LibreOffice.app/Contents/MacOS/soffice';
      default:
        // Linux standard paths (apt-get install libreoffice)
        return '/usr/bin/libreoffice';
    }
  }

  async convertToPdf(inputBuffer: Buffer, originalFilename: string): Promise<Buffer> {
    const tempDir = await mkdtemp(join(tmpdir(), 'itsa-cert-'));
    const inputFilePath = join(tempDir, originalFilename);
    const outputFilename = originalFilename.replace(/\.[^/.]+$/, "") + '.pdf';
    const outputFilePath = join(tempDir, outputFilename);

    try {
      // 1. Write the input buffer to a temporary file
      await writeFile(inputFilePath, inputBuffer);

      // 2. Spawn LibreOffice in headless mode for conversion
      await new Promise<void>((resolve, reject) => {
        const processArgs = [
          '--headless',
          '--convert-to',
          'pdf',
          '--outdir',
          tempDir,
          inputFilePath
        ];

        const libreOffice = spawn(this.libreOfficePath, processArgs);

        let errorOutput = '';

        libreOffice.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        libreOffice.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            logger.error(`LibreOffice conversion failed with code ${code}: ${errorOutput}`);
            reject(new InternalError('Failed to convert document to PDF'));
          }
        });

        libreOffice.on('error', (err) => {
          logger.error(`Failed to start LibreOffice: ${err.message}`);
          reject(new InternalError(`Failed to start LibreOffice. Is it installed at ${this.libreOfficePath}?`));
        });
      });

      // 3. Read the generated PDF back into memory
      const pdfBuffer = await readFile(outputFilePath);
      return pdfBuffer;

    } finally {
      // 4. Cleanup temporary files asynchronously
      rm(tempDir, { recursive: true, force: true }).catch(err => {
        logger.error(`Failed to cleanup temp directory ${tempDir}: ${err.message}`);
      });
    }
  }
}

// Export a singleton instance based on the current environment configuration
// Future: This could easily swap to a CloudConvertService or GotenbergService via env vars.
export const documentConversionService: IDocumentConversionService = new LibreOfficeConversionService();
