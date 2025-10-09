// Mock for node-fetch to avoid ES module issues
/* global jest */
module.exports = jest.fn(() => Promise.resolve({
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
  ok: true,
  status: 200
}));
