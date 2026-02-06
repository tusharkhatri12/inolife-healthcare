#!/usr/bin/env node
/**
 * Create Admin (Owner) user for INOLIFE Healthcare.
 * Use when backend is on Render or any host. Writes to MongoDB via your API.
 *
 * Usage:
 *   node scripts/create-admin.js
 *   API_URL=https://inolife-backend.onrender.com node scripts/create-admin.js
 *   API_URL=http://localhost:3000 node scripts/create-admin.js
 *
 * Default API_URL: https://inolife-backend.onrender.com
 */

const https = require('https');
const http = require('http');

const API_BASE = (process.env.API_URL || 'https://inolife-backend.onrender.com').replace(/\/+$/, '');
const REGISTER_URL = `${API_BASE}/api/auth/register`;

const body = {
  name: 'Admin',
  email: 'admin@inolife.com',
  password: 'admin123',
  role: 'Owner',
  phone: '9876543210',
};

const payload = JSON.stringify(body);
const url = new URL(REGISTER_URL);
const isHttps = url.protocol === 'https:';
const lib = isHttps ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

console.log('Creating Admin user...');
console.log('Backend:', REGISTER_URL);
console.log('');

const req = lib.request(options, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const data = Buffer.concat(chunks).toString('utf8');
    let json;
    try {
      json = JSON.parse(data);
    } catch {
      json = { success: false, message: data || res.statusMessage };
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Admin user created successfully.');
      console.log('');
      console.log('Login credentials:');
      console.log('  Email:    admin@inolife.com');
      console.log('  Password: admin123');
      console.log('');
      process.exit(0);
      return;
    }

    if (res.statusCode === 400 && (json.message || '').toLowerCase().includes('already exists')) {
      console.log('Admin user already exists.');
      console.log('');
      console.log('Login credentials:');
      console.log('  Email:    admin@inolife.com');
      console.log('  Password: admin123');
      console.log('');
      process.exit(0);
      return;
    }

    console.error('Error creating admin:', json.message || data || res.statusCode);
    process.exit(1);
  });
});

req.on('error', (err) => {
  console.error('Request failed:', err.message);
  console.error('');
  console.error('Ensure:');
  console.error('  1. Backend is reachable at', API_BASE);
  console.error('  2. MongoDB (e.g. Atlas) is connected to the backend');
  console.error('  3. For local backend: API_URL=http://localhost:3000 node scripts/create-admin.js');
  process.exit(1);
});

req.setTimeout(60000, () => {
  req.destroy();
  console.error('Request timed out (Render free tier may need 30–60s to wake). Try again.');
  process.exit(1);
});

req.write(payload);
req.end();
