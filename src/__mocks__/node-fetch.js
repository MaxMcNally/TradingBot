// Mock for node-fetch to avoid ES module issues in Jest
module.exports = {
  default: jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
    headers: new Map()
  }))
};
