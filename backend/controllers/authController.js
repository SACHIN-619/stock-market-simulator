import jwt from "jsonwebtoken";
const { sign } = jwt;
import { hash, compare } from "bcryptjs";
import { userModel } from "../models/UserModel.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinaryUpload.js";

// ──────────────────────────────────────────────
// REGISTER USER
// ──────────────────────────────────────────────
export const registerUser = async (req, res, next) => {
    try {
        const allowedRoles = ["trader", "admin", "stockmanager"];
        const newUser = req.body;

        if (!allowedRoles.includes(newUser.role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        newUser.password = await hash(newUser.password, 12);
        const newUserDoc = new userModel(newUser);
        await newUserDoc.save();

        res.status(201).json({ message: "User registered" });
    } catch (err) {
        next(err);
    }
};

// ──────────────────────────────────────────────
// LOGIN USER
// ──────────────────────────────────────────────
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ 
            email: new RegExp('^' + email + '$', 'i') 
        }).lean();

        if (!user) {
            return res.status(400).json({ message: "Please register first" });
        }

        // Check if blocked
        if (user.role === "trader" && user.isUserActive === false) {
            return res.status(403).json({
                message: "Your account has been blocked by the Administrator. Please contact support.",
            });
        }

        const isMatched = await compare(password, user.password);
        if (!isMatched) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // ── JWT payload: NO walletBalance — it goes stale immediately ──
        const signedToken = sign(
            {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                // walletBalance intentionally excluded — always fetch fresh from DB
            },
            process.env.SECRET_KEY,
            { expiresIn: "1h" }
        );

        // ── Secure cookie ──
        res.cookie("token", signedToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 60 * 60 * 1000, // 1 hour in ms
        });

        // Remove password before sending
        const { password: _pw, ...userPayload } = user;

        res.status(200).json({ message: "Login success", payload: userPayload });
    } catch (err) {
        next(err);
    }
};

// ──────────────────────────────────────────────
// LOGOUT USER
// ──────────────────────────────────────────────
export const logoutUser = async (req, res, next) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        res.status(200).json({ message: "Logout success" });
    } catch (err) {
        next(err);
    }
};

// ──────────────────────────────────────────────
// GET PROFILE
// ──────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select("-password").lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User Profile", payload: user });
    } catch (err) {
        next(err);
    }
};

// ──────────────────────────────────────────────
// UPDATE PROFILE
// ──────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { username, email, password, currentPassword, profileImage } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (password) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to set a new one" });
            }
            const isMatch = await compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password doesn't match" });
            }
            user.password = await hash(password, 12);
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (profileImage !== undefined) user.profileImage = profileImage;

        await user.save();

        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.status(200).json({ message: "Profile updated successfully", payload: updatedUser });
    } catch (err) {
        next(err);
    }
};

// ──────────────────────────────────────────────
// CHANGE PASSWORD (stub implemented)
// ──────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both current and new password are required" });
        }

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

        user.password = await hash(newPassword, 12);
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
        next(err);
    }
};

// ──────────────────────────────────────────────
// UPLOAD PROFILE IMAGE
// ──────────────────────────────────────────────
export const uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = req.user.id;

        // Find existing user to clean up their old profile image if it exists on Cloudinary
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete old profile image from Cloudinary if it exists
        if (user.profileImage && user.profileImage.includes("cloudinary.com")) {
            await deleteFromCloudinary(user.profileImage);
        }

        // Upload new image buffer to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);
        const fileUrl = result.secure_url;

        // Save new Cloudinary URL in the database
        user.profileImage = fileUrl;
        await user.save();

        // Return updated user object without password
        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.status(200).json({
            message: "Profile image uploaded successfully",
            payload: updatedUser,
        });
    } catch (err) {
        next(err);
    }
};

// ──────────────────────────────────────────────
// REMOVE PROFILE IMAGE
// ──────────────────────────────────────────────
export const removeProfileImage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete profile image from Cloudinary if it exists
        if (user.profileImage && user.profileImage.includes("cloudinary.com")) {
            await deleteFromCloudinary(user.profileImage);
        }

        user.profileImage = "";
        await user.save();

        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.status(200).json({
            message: "Profile image removed successfully",
            payload: updatedUser,
        });
    } catch (err) {
        next(err);
    }
};