/**
 * Simple doctor identification middleware for environments without JWT.
 * It reads the doctor ID from the request header `x-doctor-id` and attaches
 * a minimal doctor object to `req.doctor`.
 *
 * If the header is missing, the request proceeds without a doctor – the
 * controller will then use its own fallback (query/body params) or reject.
 */
module.exports.setDoctor = (req, res, next) => {
  const header = req.headers['x-doctor-id'];
  if (header) {
    const id = parseInt(header, 10);
    if (!isNaN(id)) {
      req.doctor = { id };
    }
  }
  next();
};
