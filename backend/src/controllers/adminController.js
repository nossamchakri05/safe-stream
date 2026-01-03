const User = require('../models/User');
const Tenant = require('../models/Tenant');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate('tenantId', 'name');
        res.send(users);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).send();
        res.send(user);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
};

exports.getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find({});
        res.send(tenants);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
};
