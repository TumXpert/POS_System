const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const getToken = () => {
        const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
        if (!authHeader) return null;
        return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    };

    const token = getToken();

    if (!token) return res.status(401).json({ message: 'Not authorized, token missing' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('JWT Error:', err.message);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = protect;
