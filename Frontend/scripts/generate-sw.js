#!/usr/bin/env node
/**
 * Generate firebase-messaging-sw.js from template with .env values
 * This script runs before build to inject Firebase config into the service worker
 * Works in Docker (using ENV vars) and locally (using .env file)
 */

const fs = require('fs');
const path = require('path');

// Simple .env parser (no dependencies needed)
function loadEnvFromFile() {
    const envPath = path.resolve(__dirname, '../../.env');
    if (!fs.existsSync(envPath)) {
        return {};
    }
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=').trim();
                // Remove quotes if present
                value = value.replace(/^['"](.*)['"]$/, '$1');
                env[key.trim()] = value;
            }
        }
    });
    
    return env;
}

// Load from environment variables first (Docker), then from .env file (local)
const fileEnv = loadEnvFromFile();
const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fileEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fileEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fileEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || fileEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || fileEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fileEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || fileEnv.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const template = fs.readFileSync(
    path.resolve(__dirname, '../firebase-messaging-sw.template.js'),
    'utf-8'
);

// Replace placeholders with actual environment variables
let output = template
    .replace('{{NEXT_PUBLIC_FIREBASE_API_KEY}}', env.NEXT_PUBLIC_FIREBASE_API_KEY || '')
    .replace('{{NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}}', env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '')
    .replace('{{NEXT_PUBLIC_FIREBASE_PROJECT_ID}}', env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '')
    .replace('{{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}}', env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '')
    .replace('{{NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}}', env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '')
    .replace('{{NEXT_PUBLIC_FIREBASE_APP_ID}}', env.NEXT_PUBLIC_FIREBASE_APP_ID || '')
    .replace('{{NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}}', env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '');

// Add generation notice
output = `// ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from firebase-messaging-sw.template.js using generate-sw.js
// Run 'npm run generate:sw' to regenerate

${output}`;

// Write to public directory
const outputPath = path.resolve(__dirname, '../public/firebase-messaging-sw.js');
fs.writeFileSync(outputPath, output);

console.log('✅ Generated firebase-messaging-sw.js from .env variables');

// Validate that all required variables were found
const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
];

const missingVars = requiredVars.filter(varName => !env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required Firebase environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('   Service worker will not work correctly.');
    console.error('   Make sure these are set in .env file or as environment variables.');
    process.exit(1);
}

console.log('✅ All required Firebase variables present');
