// Mock for node-fetch to avoid ES module issues in Jest
// eslint-disable-next-line no-undef
module.exports = {
  default: jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
    headers: new Map()
  }))
};
