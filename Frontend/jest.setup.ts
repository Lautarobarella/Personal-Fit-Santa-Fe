import '@testing-library/jest-dom';
// Polyfill mínimos para entorno de pruebas (Next server modules esperan Request/Response/Headers)
if (!(global as any).Request) {
  (global as any).Request = class {} as any
}
if (!(global as any).Response) {
  (global as any).Response = class {} as any
}
if (!(global as any).Headers) {
  (global as any).Headers = class {} as any
}
if (!(global as any).fetch) {
  (global as any).fetch = (..._args: any[]) => Promise.reject(new Error('fetch not implemented in test'))
}

// Mock scrollIntoView for JSDOM
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Default mock for Next.js router hooks used by components like BottomNav
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
}))

// Ensure global Request exists for Next.js server route modules
// jsdom provides window.Request; Next expects globalThis.Request
if (!(global as any).Request && typeof (window as any) !== 'undefined' && (window as any).Request) {
  ;(global as any).Request = (window as any).Request
}

// Silence noisy API error logs during tests to keep output clean
const originalError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && 
      (args[0].includes('API Error') || 
       args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: ReactDOM.render'))) {
    return;
  }
  originalError(...args);
};

