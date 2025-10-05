describe('Test Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have environment variables available', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
