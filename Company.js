const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    industry: {
        type: String,
        required: true
    },
    website: {
        type: String,
        trim: true
    },
    logo: {
        type: String, // URL to logo image
        default: 'default-company-logo.png'
    },
    location: {
        address: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
        required: true
    },
    founded: {
        type: Number
    },
    socialMedia: {
        linkedin: String,
        twitter: String,
        facebook: String
    },
    contact: {
        email: {
            type: String,
            required: true
        },
        phone: String
    },
    owners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    employees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    activeJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
companySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for search functionality
companySchema.index({
    name: 'text',
    description: 'text',
    industry: 'text'
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company; 