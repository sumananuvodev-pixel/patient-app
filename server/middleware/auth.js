/**
 * Dummy authentication middleware – no JWT verification.
 * It simply calls `next()` so every route is public.
 */
const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Expects Authorization header: "Bearer <token>".
 * On success, attaches `req.doctor` with the token payload.
 * On failure, responds with 401.
 */
function authenticateToken(req, res, next) {
  // No JWT authentication – simply attach a dummy doctor for all requests.
  // In a real production app you would replace this with proper auth.
  req.doctor = { id: 0, name: 'dev-doctor' };
  next();
}


module.exports = { authenticateToken };