import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl)
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key)
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset()
  }

  // Cache key generators for different data types
  generateProjectKey(projectId: string): string {
    return `project:${projectId}`
  }

  generateUserProjectsKey(userId: string): string {
    return `user:${userId}:projects`
  }

  generateScenarioKey(scenarioId: string): string {
    return `scenario:${scenarioId}`
  }

  generateUserScenariosKey(userId: string, includePublic: boolean): string {
    return `user:${userId}:scenarios:${includePublic ? 'public' : 'private'}`
  }

  generateComputationKey(inputsHash: string): string {
    return `computation:${inputsHash}`
  }

  generateExportKey(scenarioId: string, type: 'pdf' | 'excel'): string {
    return `export:${scenarioId}:${type}`
  }

  // Helper method to create hash from scenario inputs for caching computations
  createInputsHash(inputs: any): string {
    const sortedInputs = JSON.stringify(inputs, Object.keys(inputs).sort())
    return Buffer.from(sortedInputs).toString('base64').substring(0, 32)
  }
}