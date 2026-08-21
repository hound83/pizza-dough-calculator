'use strict';

const {defineConfig}=require('playwright/test');

module.exports=defineConfig({
  testDir:'./tests/browser',
  fullyParallel:false,
  workers:1,
  retries:process.env.CI?1:0,
  timeout:30_000,
  expect:{timeout:5_000},
  reporter:process.env.CI?'line':'list',
  use:{
    baseURL:'http://127.0.0.1:4173',
    browserName:'chromium',
    colorScheme:'dark',
    locale:'nl-NL',
    screenshot:'only-on-failure',
    trace:'retain-on-failure'
  },
  webServer:{
    command:'node tests/support/static-server.js',
    url:'http://127.0.0.1:4173/index.html',
    reuseExistingServer:!process.env.CI,
    timeout:10_000
  }
});
