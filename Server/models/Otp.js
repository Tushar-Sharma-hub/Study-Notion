//OTP model to store the OTPs generated for email verification. 
//Each OTP document will have an email, the OTP itself, and a timestamp.
//The OTP will expire after a certain period (e.g., 5 minutes) using MongoDB's TTL index feature. 
//When a new OTP document is created, an email will be sent to the user with the OTP for verification.
//Using pre middleware to send the email before saving the OTP document in the database.
const mongoose = require('mongoose');
const mailSender = require('../util/mailSender');

const OTPSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
    },
    otp:{
        type: String,
        required: true,
    },
    timestamp:{
        type: Date,
        default: Date.now,
        expires: 300, // OTP expires after 5 minutes (300 seconds)
    },
});

//Function to sedn otp to user email
async function sendVerficationEmail(email, otp){
    try{
        const mailResponse = await mailSender(email, "Verification for Study Notion", `Your OTP for Study Notion is: ${otp}. It will expire in 5 minutes.`);
        console.log('OTP email sent successfully:', mailResponse);
    }catch (error) {
        console.error('Error sending OTP email:', error);
        throw error;
    }
}

// Pre-save hook to send OTP email before saving the document (document is the otp document which is being saved in database)
OTPSchema.pre('save', async function(next){
    await sendVerficationEmail(this.email, this.otp); //this refers to the OTP document which is being saved in database
    next();
});


module.exports = mongoose.model('Otp', OTPSchema);