'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip:       process.env.OPENSHIFT_NODEJS_IP ||
            process.env.IP ||
            undefined,

  // Server port
  port:     process.env.OPENSHIFT_NODEJS_PORT ||
            process.env.PORT ||
            8080,

  sequelize: {
    uri: process.env.DATABASE_URL,
    options: {
      dialog: 'postgres',
      port: 5432,
      logging: false,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD
    }
  },

  seedDB: false
};
