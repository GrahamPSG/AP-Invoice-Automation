import { Job } from 'bullmq';
import { QueueMessage, ProcessingResult } from '@paris/shared';
import { ServiceTitanClient } from '../clients/servicetitan.client';
import { logger } from '../utils/logger';

const serviceTitanClient = new ServiceTitanClient();

export class ServiceTitanMatchProcessor {
  static async process(job: Job<QueueMessage>): Promise<ProcessingResult> {
    const { id, payload } = job.data;
    
    try {
      logger.info(`Processing ServiceTitan match: ${id}`);
      
      // TODO: Implement matching logic
      // - Find PO in ServiceTitan
      // - Match vendor, job, tech, truck
      // - Calculate variance
      // - Determine action based on rules
      
      return {
        success: true,
        message: 'ServiceTitan matching completed',
        nextStep: 'servicetitan-bill'
      };
      
    } catch (error) {
      logger.error(`ServiceTitan matching failed: ${error.message}`, { id, error });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}