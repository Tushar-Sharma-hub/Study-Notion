const mongoose=require('mongoose');
require('dotenv').config();

exports.connectDB=()=>{
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log('Connected to MongoDB');
    })
    .catch((err)=>{
        console.log('Error connecting to MongoDB',err);
        process.exit(1);
    });
}