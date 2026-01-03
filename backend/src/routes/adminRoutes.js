const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

router.get('/users', auth, authorize('Admin'), adminController.getAllUsers);
router.delete('/users/:id', auth, authorize('Admin'), adminController.deleteUser);
router.get('/tenants', auth, authorize('Admin'), adminController.getAllTenants);

module.exports = router;
