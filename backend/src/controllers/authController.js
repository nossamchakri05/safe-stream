const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

exports.register = async (req, res) => {
    try {
        const { username, email, password, role, tenantName } = req.body;

        let tenantId = null;
        let tenantDisplayName = 'System';

        // Find or create tenant (only if not a global Admin or if tenantName is provided)
        if (role === 'Admin') {
            return res.status(403).send({ error: 'Admin registration is not allowed' });
        }

        if (role !== 'Admin' || tenantName) {
            if (!tenantName) {
                return res.status(400).send({ error: 'Organization name is required for this role' });
            }
            let tenant = await Tenant.findOne({ name: tenantName });
            if (!tenant) {
                tenant = new Tenant({ name: tenantName });
                await tenant.save();
            }
            tenantId = tenant._id;
            tenantDisplayName = tenant.name;
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role,
            tenantId
        });

        await user.save();
        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
        res.status(201).send({
            user: { ...user._doc, tenantName: tenantDisplayName },
            token
        });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).send({ error: 'Username or email already exists' });
        }
        res.status(400).send({ error: e.message });
    }
};

exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).send({ error: 'Invalid login credentials' });
        }

        let tenantName = 'System';
        if (user.tenantId) {
            const tenant = await Tenant.findById(user.tenantId);
            tenantName = tenant ? tenant.name : 'Unknown';
        }

        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
        res.send({
            user: { ...user._doc, tenantName },
            token
        });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
};
