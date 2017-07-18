module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'gr-core-api',
      script    : 'app.js',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
