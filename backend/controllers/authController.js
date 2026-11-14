import User from '../models/User.js';
import Employee from '../models/Employee.js';
import bcrypt from 'bcryptjs';
import { sendOtpEmail, sendResetOtpEmail } from '../config/brevo.js';
import jwt from 'jsonwebtoken';

// Sign up an admin
export const signupAdmin = async (req, res) => {
  try {
    // Get form fields
    const { name, email, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Admin already exists.',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
    });

    // Send email that contains the OTP
    sendOtpEmail(email, otp, name).catch((err) =>
      console.error('Error sending admin verification OTP email:', err)
    );

    res.status(201).json({
      message: 'Admin registered successfully. Please verify your email.',
      email: user.email,
    });
  } catch (err) {
    console.error('Signup Error', err);
    res.status(500).json({
      message: 'Server Error',
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    // Get form inputs
    const { email, password } = req.body;

    // Check that the use exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'User not found.',
      });
    }

    // Verify user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        message: 'Your account is not verified. Please verify you email.',
        isVerified: false,
        email: user.email,
      });
    }

    // Match passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid credentials.',
      });
    }

    // Generate jsonwebtoken
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const employee = await Employee.findOne({ workEmail: user.email });

    res.status(200).json({
      message: 'Login successful.',
      token,
      role: user.role,
      name: user.name,
      employeeId: employee ? employee.employeeId : undefined,
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({
      message: 'Server Error',
    });
  }
};

// Verify the OTP
export const verifyOtp = async (req, res) => {
  try {
    // Get inputs
    const { email, otp } = req.body;

    // Verify input
    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required.',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    // Is the user verified
    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email is already verified.',
      });
    }

    // Check if OTP matches
    if (user.verificationOtp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP',
      });
    }

    // Check if OTP has expired
    if (new Date() > user.verificationOtpExpires) {
      return res.status(400).json({
        message: 'OTP code has expired. Please request a new one.',
      });
    }

    // Set verification status
    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Verify OTP:', error);
    res.status(500).json({
      message: 'Server Error',
    });
  }
};

// Resend the OPT code
export const resendOtp = async (req, res) => {
  try {
    // Get email
    const { email } = req.body;

    // Verify email
    if (!email) {
      return res.status(400).json({
        message: 'Email is required.',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    // Is the user verified
    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email is already verified.',
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Set OPT values
    user.verificationOtp = otp;
    user.verificationOtpExpires = otpExpires;

    // Update user
    await user.save();

    // Send OPT email
    sendOtpEmail(email, otp, user.name).catch((err) =>
      console.error('Error resending the OTP email:', err)
    );

    // Send success message
    res.status(200).json({
      message: 'A new OPT code ahs been sent to your email.',
    });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({
      message: 'Server Error',
    });
  }
};

// Send forgot password email
export const forgotPassword = async (req, res) => {
  try {
    // Get the users email
    const { email } = req.body;

    // Verify email
    if (!email) {
      return res.status(400).json({
        message: 'Email is required.',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Set OTP
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = otpExpires;

    // Update suer
    await user.save();

    // Send OTP email
    sendResetOtpEmail(email, otp, user.name).catch((err) =>
      console.error('Error sending the reset password OTP email:', err)
    );

    // Return success status
    res.status(200).json({
      message: 'Password reset OTP sent successfully to your email.',
    });
  } catch (err) {
    console.error('Forgot password Error:', err);
    res.status(500).json({
      message: 'Server Error',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    // Get form values
    const { email, otp, newPassword } = req.body;

    // Verify form values exist
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Email, OTP, and new password are required.',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    // Validate OTP
    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP',
      });
    }

    // Check if the OPT has expired
    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({
        message: 'OTP code has expired. Please request a new one.',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;

    // Save updated user
    await user.save();

    // Return success status
    res.status(200).json({
      message: 'Password has been reset successfully. You can now login.',
    });
  } catch (err) {
    console.error('Reset password Error:', err);
    res.status(500).json({
      message: 'Server Error',
    });
  }
};
