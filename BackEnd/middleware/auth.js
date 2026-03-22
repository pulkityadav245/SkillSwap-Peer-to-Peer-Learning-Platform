const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "secretkey"
        );

        console.log("Decoded:", decoded); // 🔥 DEBUG

        req.user = decoded;

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Invalid token payload"
            });
        }

        next();

    } catch (err) {
        console.log("JWT Error:", err.message);  // DEBUG
        return res.status(401).json({
            message: "Invalid token"
        });
    }
};