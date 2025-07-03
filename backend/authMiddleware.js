// authMiddleware.js (ES Module)
import admin from './firebase-admin-init.js'; // Use import and .js extension

const authMiddleware = async (req, res, next) => {
  // 1. Check for Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided or invalid format.' });
  }

  // 2. Extract the ID token
  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 3. Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 4. Attach the decoded token (user information) to the request object
    req.user = decodedToken;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // 5. Handle token verification errors
    console.error('Error verifying Firebase ID token:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please re-authenticate.' });
    }
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
};

export default authMiddleware; // Use export default
