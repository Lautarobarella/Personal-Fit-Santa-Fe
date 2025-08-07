const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
  tsconfig: './tsconfig.jest.json',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
  ],
  // Configuración para evitar warnings
  silent: true,
  verbose: false,
  // Configuración de mocks y resolución de módulos
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Deshabilitar coverage para evitar problemas
  collectCoverage: false,
  // Configuración para evitar problemas con SWC
  transformIgnorePatterns: [
    'node_modules/(?!(next|@next|swc|@swc)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 