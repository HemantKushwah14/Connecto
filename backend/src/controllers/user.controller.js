
import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

// ================= LOGIN =================

const login = async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Username and password are required"
            });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "User Not Found"
            });
        }

        if (!user.password) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                message: "Invalid user account"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid Username or Password"
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

        // Validate input
        if (!name || !username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Name, username and password are required"
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            username,
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
            message: "Something went wrong"
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
            message: "Something went wrong"
        });
    }
};

export { login, register, getUserHistory, addToHistory };
