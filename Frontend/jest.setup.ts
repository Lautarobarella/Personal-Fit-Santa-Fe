import '@testing-library/jest-dom';

// Default mock for Next.js router hooks used by components like BottomNav
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
}))

// Silence noisy API error logs during tests to keep output clean
const originalError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('API Error')) {
    return;
  }
  originalError(...args);
};

