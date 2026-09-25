// Production entrypoint shim for Cloud Run / Node runtimes
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
import('./dist/server.cjs');
