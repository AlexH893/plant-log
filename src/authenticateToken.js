const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {

  const token = req.header("Authorization")?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(403).send("Access denied. No token provided.");
  }

  console.log("YOUR TOKEN:", token); // Log the token for debugging

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send("Invalid token.");
    }

    console.log("Decoded User:", user); // Log the decoded user info for verification

    req.user = user; // Attach user data to the request object
    next();
  });
}

module.exports = authenticateToken;
