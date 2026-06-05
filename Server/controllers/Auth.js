const User = require('../models/User');
const Otp = require('../models/Otp');
const otpGenerator = require('otpGenerator');
const profile = require('../models/Profile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender=require('../util/mailSender');
require("dotenv").config();

//signup
exports.signup = async (req, res) => {
    try{
        //data nikalo req se.
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(400).json({ message: "All fields are required." });
        }
        if(password !== confirmPassword){
            return res.status(400).json({ message: "Password and confirm password do not match." });
        }

        //existing user check
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({ message: "User with this email already exists." });
        }

        //recent otp check
        const recentOtp = await Otp.findOne({ email }).sort({ createdAt: -1 }).limit(1); // createdAt ke basis pe sort karenge aur latest otp ko check karenge.limit(1) mtlb ki sirf ek hi document milega jo ki latest otp hoga.
        if(!recentOtp){
            return res.status(400).json({ message: "No OTP found for this email. Please request a new OTP." });
        }
        if(recentOtp.otp !== otp){
            return res.status(400).json({ message: "Invalid OTP." });
        }

        //create user
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        })
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed= ${firstName} ${lastName}`, //generate random image using dicebear api with first name and last name as seed.
        });
        console.log("User created successfully:", user);

        return res.status(200).json({ success: true, message: "User created successfully." });
    } catch (error) {
        console.error("Error occurred while creating user:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

//Otp generation and updating otp document in database.
exports.sendOtp = async (req, res) => {
    try{
        const { email } = req.body;

        // Check if the user with the provided email already exists
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(401).json({ message: "User with this email already exists." });
        }
        // Generate a 6-digit OTP
        const otp = otpGenerator.generate(6, { upperCase: false, lowercase: false, specialChars: false });
        console.log("Generated OTP:", otp);

        // Check unique otp or not.
        const existingOtp = await Otp.findOne({ otp });
        while(existingOtp){
            otp = otpGenerator.generate(6, { upperCase: false, lowercase: false, specialChars: false });
            existingOtp = await Otp.findOne({ otp });
        }

        // Create a new OTP document and save it to the database
        const otpPayload = { email, otp };
        const otpBody = await Otp.create(otpPayload);
        //jb ye create krenge humne premiddleware use kiya hai otp model me to ye otp create hone se pehle hi email bhej dega user ko. 
        //aur jab otp document database me save ho jayega tabhi response bhejenge user ko ki otp sent successfully.
        console.log("OTP document created successfully:", otpBody);

        return res.status(200).json({ success: true, message: "OTP sent successfully to your email." });

    } catch (error) {
        console.error("Error occurred while sending OTP:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

//login
exports.login = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({ message: "Email and password are required." });
        }
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ message: "User with this email does not exist." });
        }
        //match using bcrypt.compare() method which will compare the plain text password with the hashed password stored in database and return true or false.
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({ message: "Invalid password." });
        }

        //generate jwt token
        const payload = {
            id: user._id,
            email: user.email,
            accountType: user.accountType,
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
        user.token = token; //store the token in user document in database.
        user.password = undefined; //password ko response me nahi bhejna hai.

        //create cookie and sent response
        const options={
            expires: new Date(Date.now()+3*24*60*60*1000),
            httpOnly:true,
        }
        res.cookies('token', token, options).status(200).json({
            success:true,
            token,
            user,
            message:"Logged in successfully"
        })
    } catch (error) {
        console.error("Error occurred while logging in:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

//change password
exports.changePassword=async(req,res)=>{
    try {
		 
		const userDetails = await User.findById(req.user.id);
    //get data from req body
     //get oldPassword,newPassword,confirmNewPassword
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

    //Validation
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			return res.status(401).json({ success: false, message: "The password is incorrect" });
		}
		if (newPassword !== confirmNewPassword) {
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match",
			});
		}
        
        //Hashing and updating    
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);
        
        //Send mail
		try {
			const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password Changed Successfully",
                `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
            );
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}
    
		return res.status(200).json({ success: true, message: "Password updated successfully" });

	} catch (error) {
		
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
    
}