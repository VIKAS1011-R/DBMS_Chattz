import cloudinary from "../lib/cloudinary.js";
import { generateTokens } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req,res)=>{
    const{ email, fullName, password} = req.body;
    try {
        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters long"})
        }

        if(!email || !fullName || !password  ){
            return res.status(400).json({message: "Alll fields are required!"})
        }
        
        const user = await User.findOne({ email });
        if(user){
            return res.status(400).json({message: "User already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            email,
            fullName,
            password: hashedPassword,
        });

        if(newUser){
            generateTokens(newUser._id, res);
            await newUser.save();
            return res.status(201).json({
                _id: newUser._id,
                email: newUser.email,
                fullName: newUser.fullName,
                profilePic: newUser.profilePic,
            })
        }else{
            return res.status(500).json({message: "User creation failed"})
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal server error"})
    }

}

export const login = async  (req,res)=>{

    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        generateTokens(user._id, res);
        return res.status(200).json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const logout = (req,res)=>{
    try {
        // Clear the cookie
        res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const {profilePic, fullName} = req.body;
        const userId = req.user._id;
        if(!profilePic){
            return res.status(400).json({message: "Profile pic is required!"})
        }
        //upload the image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, {
            profilePic: uploadResponse.secure_url,
            // fullName: fullName,
        }, { new: true });
        res.status(200).json({message: "Profile updated successfully", user: updatedUser});

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const checkAuth = (req, res) => {
    try{
        res.status(200).json(req.user );
    }catch (error) {
        console.log("Check the checkAuth middleware",error);
        return res.status(500).json({ message: "Internal server error" });
    }
}