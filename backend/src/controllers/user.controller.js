import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

// Escape regex special characters helper
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ================= LOGIN =================

const login = async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Username/Email and password are required"
            });
        }

        const cleanUsername = username.trim();

        // Case-insensitive user lookup
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${escapeRegex(cleanUsername)}$`, "i") }
        });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "User not found. Please register an account first."
            });
        }

        if (!user.password) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                message: "Invalid account setup. Please contact support or re-register."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid username or password"
            });
        }

        // Generate authentication token
        const token = crypto.randomBytes(20).toString("hex");

        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({
            message: "Login Successful",
            token: token
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong during login"
        });
    }
};


// ================= REGISTER =================

const register = async (req, res) => {
    try {
        const { name, username, password } = req.body || {};

        if (!name || !username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Name, username/email and password are required"
            });
        }

        const cleanName = name.trim();
        const cleanUsername = username.trim();

        if (password.length < 4) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Password must be at least 4 characters long"
            });
        }

        // Check if user already exists (case-insensitive)
        const existingUser = await User.findOne({
            username: { $regex: new RegExp(`^${escapeRegex(cleanUsername)}$`, "i") }
        });

        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({
                message: "An account with this username/email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name: cleanName,
            username: cleanUsername,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({
            message: "User Registered Successfully"
        });

    } catch (error) {
        console.error("Register Error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong during registration"
        });
    }
};


// ================= GET USER HISTORY =================

const getUserHistory = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Token is required"
            });
        }

        const user = await User.findOne({ token });

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid token"
            });
        }

        const meetings = await Meeting.find({
            user_id: user.username
        });

        return res.status(httpStatus.OK).json(meetings);

    } catch (error) {
        console.error("History Error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong fetching history"
        });
    }
};


// ================= ADD TO HISTORY =================

const addToHistory = async (req, res) => {
    try {
        const { token, meeting_code } = req.body || {};

        if (!token || !meeting_code) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Token and meeting code are required"
            });
        }

        const user = await User.findOne({ token });

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid token"
            });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({
            message: "Added code to history"
        });

    } catch (error) {
        console.error("Add History Error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong adding to history"
        });
    }
};

export { login, register, getUserHistory, addToHistory };
