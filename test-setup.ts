import { beforeAll, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
})