process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./server/config/environment');

require('./server/config/seed')(); 