// firebase-admin-init.js (ES Module)
import admin from 'firebase-admin';
import fs from 'fs'; // Import the Node.js file system module
import path from 'path'; // Import the path module for resolving file paths
import { fileURLToPath } from 'url'; // Import for resolving __dirname in ES Modules

// Get the current directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to your service account key file
// Ensure this path is correct relative to where firebase-admin-init.js is located
const serviceAccountPath = path.resolve(__dirname, 'heardattack2-firebase-adminsdk-fbsvc-3dc6eb8e74.json');

// Read the service account key file synchronously
// In a production environment, consider reading this asynchronously or loading from environment variables
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin SDK initialized.');

export default admin;
