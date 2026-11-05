process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://unused';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.RATE_LIMIT_DISABLED = '1';
