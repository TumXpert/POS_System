// middleware/roleMiddleware.js
module.exports = function checkRole(...allowedRoles) {
    return (req, res, next) => {
      const userRole = req.user?.role;
  
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Access denied: insufficient role' });
      }
  
      next();
    };
  };
  