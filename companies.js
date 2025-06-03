const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { auth, checkRole } = require('../middleware/auth');

// Create a new company
router.post('/', auth, checkRole(['employer', 'admin']), async (req, res) => {
    try {
        const company = new Company({
            ...req.body,
            owners: [req.user._id]
        });
        await company.save();
        res.status(201).json(company);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all companies
router.get('/', async (req, res) => {
    try {
        const { industry, size, status, search } = req.query;
        const query = {};

        if (industry) query.industry = industry;
        if (size) query.size = size;
        if (status) query.status = status;
        if (search) {
            query.$text = { $search: search };
        }

        const companies = await Company.find(query)
            .populate('owners', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get company by ID
router.get('/:id', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('owners', 'firstName lastName email')
            .populate('activeJobs');
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update company
router.put('/:id', auth, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user is owner or admin
        if (!company.owners.includes(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this company' });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        res.json(updatedCompany);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete company
router.delete('/:id', auth, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user is owner or admin
        if (!company.owners.includes(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this company' });
        }

        await company.remove();
        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add employee to company
router.post('/:id/employees', auth, checkRole(['employer', 'admin']), async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user is owner or admin
        if (!company.owners.includes(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to add employees' });
        }

        const { employeeId } = req.body;
        if (!company.employees.includes(employeeId)) {
            company.employees.push(employeeId);
            await company.save();
        }

        res.json(company);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Remove employee from company
router.delete('/:id/employees/:employeeId', auth, checkRole(['employer', 'admin']), async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user is owner or admin
        if (!company.owners.includes(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to remove employees' });
        }

        company.employees = company.employees.filter(
            emp => emp.toString() !== req.params.employeeId
        );
        await company.save();
        res.json(company);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 