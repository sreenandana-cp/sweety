const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Please log in again." });
  }
};
