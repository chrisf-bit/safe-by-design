import { initDatabase } from '../database';

console.log('Initializing JSON database...');

try {
  initDatabase();
  console.log('✓ JSON database initialized successfully');
  console.log('✓ Data files created');
  console.log('✓ Storage ready');
  console.log('\nDatabase is ready to use!');
  console.log('Run "npm run dev" to start the server.');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}
