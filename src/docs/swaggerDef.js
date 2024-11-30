const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Resort Management System API documentation',
    version,
    license: {
      name: 'MIT',
      url: 'https://github.com/FiveD-SE/ResortManagementSystem-BE/blob/main/LICENSE',
    },
  },
  servers: [
    {
      url: `${config.host}/v1`,
    },
  ],
};

module.exports = swaggerDef;
