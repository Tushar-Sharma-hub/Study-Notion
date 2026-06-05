//Course will have multiple tags and a tag can be associated with multiple courses.
//This will help in categorizing the courses and making it easier for students to find courses based on their interests.
const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    tagName:{
        type: String,
        required: true,
        trim: true
    },
    description:{
        type: String,
        required: true,
        trim: true
    },
    course:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }
});

module.exports = mongoose.model('Tag', tagSchema);