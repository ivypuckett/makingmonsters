import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

let baseUrl;
let response;
let responseBody;

Given('the server is running on port {int}', function (port) {
  baseUrl = `http://localhost:${port}`;
});

When('I request the health endpoint', async function () {
  response = await fetch(`${baseUrl}/api/health`);
  responseBody = await response.json();
});

Then('the response status should be {int}', function (expectedStatus) {
  assert.equal(response.status, expectedStatus);
});

Then('the response body should indicate the server is healthy', function () {
  assert.ok(responseBody, 'Response body should not be empty');
  // PocketBase health endpoint returns { "code": 200, "message": "API is healthy." }
  assert.equal(responseBody.code, 200);
});
