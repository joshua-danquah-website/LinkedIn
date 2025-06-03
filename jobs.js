const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// Get all jobs with filters
router.get('/', async (req, res) => {
    try {
        const {
            search,
            location,
            type,
            experience,
            minSalary,
            page = 1,
            limit = 10
        } = req.query;

        const query = { status: 'active' };

        // Add search filter
        if (search) {
            query.$text = { $search: search };
        }

        // Add location filter
        if (location) {
            query.location = new RegExp(location, 'i');
        }

        // Add job type filter
        if (type) {
            query.type = type;
        }

        // Add experience filter
        if (experience) {
            query.experience = experience;
        }

        // Add salary filter
        if (minSalary) {
            query['salary.min'] = { $gte: parseInt(minSalary) };
        }

        const jobs = await Job.find(query)
            .populate('company', 'name logo')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Job.countDocuments(query);

        res.json({
            jobs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalJobs: total
        });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Get single job
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('company', 'name logo description')
            .populate('applications.applicant', 'firstName lastName email');

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json(job);
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ message: 'Error fetching job' });
    }
});

// Create new job (employer only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'employer') {
            return res.status(403).json({ message: 'Only employers can post jobs' });
        }

        const job = new Job({
            ...req.body,
            company: req.user.company
        });

        await job.save();
        res.status(201).json(job);
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ message: 'Error creating job' });
    }
});

// Update job (employer only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'employer') {
            return res.status(403).json({ message: 'Only employers can update jobs' });
        }

        const job = await Job.findOne({
            _id: req.params.id,
            company: req.user.company
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        Object.assign(job, req.body);
        await job.save();

        res.json(job);
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ message: 'Error updating job' });
    }
});

// Delete job (employer only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'employer') {
            return res.status(403).json({ message: 'Only employers can delete jobs' });
        }

        const job = await Job.findOneAndDelete({
            _id: req.params.id,
            company: req.user.company
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ message: 'Error deleting job' });
    }
});

// Apply for job
router.post('/:id/apply', auth, async (req, res) => {
    try {
        if (req.user.role !== 'jobseeker') {
            return res.status(403).json({ message: 'Only job seekers can apply for jobs' });
        }

        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if already applied
        const alreadyApplied = job.applications.some(
            app => app.applicant.toString() === req.user._id.toString()
        );

        if (alreadyApplied) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        job.applications.push({
            applicant: req.user._id,
            resume: req.user.resume
        });

        await job.save();

        // Add to user's applied jobs
        req.user.appliedJobs.push({
            job: job._id,
            status: 'pending'
        });
        await req.user.save();

        res.json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Apply for job error:', error);
        res.status(500).json({ message: 'Error applying for job' });
    }
});

module.exports = router; 