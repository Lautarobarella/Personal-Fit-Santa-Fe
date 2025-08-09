// Polyfills for Jest testing environment

// TextEncoder/TextDecoder polyfill for Node.js environment
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Blob polyfill
global.Blob = require('blob-polyfill').Blob

// URL polyfill
const { URL, URLSearchParams } = require('url')
global.URL = URL
global.URLSearchParams = URLSearchParams

// AbortController polyfill
if (!global.AbortController) {
  global.AbortController = require('abort-controller')
}

// Web Crypto API polyfill
if (!global.crypto) {
  const { webcrypto } = require('crypto')
  global.crypto = webcrypto
}

// Performance API polyfill
if (!global.performance) {
  const { performance } = require('perf_hooks')
  global.performance = performance
}
