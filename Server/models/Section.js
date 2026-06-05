//Section is a title with multiple sub-sections. It is a part of course content. A course can have multiple sections and a section can have multiple sub-sections.
const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    sectionName:{
        type: String,
        required: true,
        trim: true
    },
    subSections:[{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'SubSection',
    }],
});

module.exports = mongoose.model('Section', sectionSchema);