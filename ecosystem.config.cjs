module.exports = {
  apps: [
    {
      name: 'tpsms-api',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
