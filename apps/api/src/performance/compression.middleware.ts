import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import * as compression from 'compression'

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private compressionHandler = compression({
    // Only compress responses larger than 1kb
    threshold: 1024,
    
    // Compression level (1-9, where 9 is best compression but slowest)
    level: 6,
    
    // Filter function to determine what to compress
    filter: (req: Request, res: Response) => {
      const contentType = res.getHeader('content-type') as string
      
      // Don't compress if client doesn't support it
      if (!req.headers['accept-encoding']?.includes('gzip')) {
        return false
      }
      
      // Don't compress binary files (images, videos, etc.)
      if (contentType) {
        const binaryTypes = [
          'image/',
          'video/',
          'audio/',
          'application/octet-stream',
          'application/pdf',
        ]
        
        if (binaryTypes.some(type => contentType.startsWith(type))) {
          return false
        }
      }
      
      // Compress JSON, HTML, CSS, JS, XML, and text files
      return compression.filter(req, res)
    },
    
    // Vary header for caching
    vary: true,
  })

  use(req: Request, res: Response, next: NextFunction): void {
    this.compressionHandler(req, res, next)
  }
}