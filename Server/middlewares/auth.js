const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = reqire("../models/User");

//auth
exports.auth=async(req,res,next)=>{
    try{
        const token=req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer","");
        if(!token){
            return res.status(401).json({success:false, message:"Token not found"});
        }
        try{
            const decode=jwt.verify(token,process.env.JWT_SECRET);
            console.log(decode);
            req.user=decode;
        }catch(error){
            return res.status(400).json({success:false , message:"token is invalid"});
        }
        next();
    }catch(error){
        return res.status(400).json({success:false , message:"Something went wrong during authorization."});
    }
}

//isStudent
exports.isStudent = async(req,res,next) => {
    try{
        if(req.user.accountType!="Student"){
            return res.status(401).json({
                success:false,
                message:"This is a protect route for student"
            });
        }
        next();
    }catch(error){
        return res.status(400).json({success:false , message:"User role can't be verfied , please try again."});
    }
}

//isInstructor
exports.isInstructor = async(req,res,next) => {
    try{
        if(req.user.accountType!="Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is a protect route for Instructor"
            });
        }
        next();
    }catch(error){
        return res.status(400).json({success:false , message:"User role can't be verfied , please try again."});
    }
}

//isAdmin
exports.isAdmin = async(req,res,next) => {
    try{
        if(req.user.accountType!="Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protect route for Admin"
            });
        }
        next();
    }catch(error){
        return res.status(400).json({success:false , message:"User role can't be verfied , please try again."});
    }
}
