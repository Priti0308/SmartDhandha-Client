import React, { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { registerUser } from "../services/authService";

const Register = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // OTP timer state
  const [timeLeft, setTimeLeft] = useState(0);

  const handleSendOTP = (e) => {
    e.preventDefault();
    // call sendOtp service
    // on success: 
    console.log("OTP sent to email",e.target); 
    registerUser.handleSendOTP(e.email.value);
    setOtpSent(true);
    setTimeLeft(300); // 5 minutes = 300 seconds
  };

  // countdown effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData);

    try {
      const response = await registerUser(userData);
      console.log("Registered:", response);
      alert("Registration successful!");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Registration failed");
    }
  };

  // helper to format mm:ss
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00264B] via-[#0173AE] to-[#B0D6E9] p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold text-[#00264B] text-center">SmartDhandha</h1>
        <p className="text-gray-500 text-center mt-1">Create Your Account</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter full name"
              required
              className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
            />
          </div>

          {/* Email + OTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                required
                className="mt-1 flex-1 border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
              />
              <button
                type="button"
                onClick={handleSendOTP}
                className="bg-gradient-to-r from-[#0173AE] to-[#66C6E6] text-white px-3 py-2 rounded-lg hover:opacity-90 transition"
              >
                {otpSent ? "Resend" : "Send OTP"}
              </button>
            </div>
          </div>

          {otpSent && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                required
                disabled={timeLeft === 0} // disable when expired
                className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE] disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {timeLeft > 0
                  ? `OTP valid for ${formatTime(timeLeft)}`
                  : "OTP expired. Please resend."}
              </p>
            </div>
          )}

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              placeholder="Enter mobile number"
              required
              className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                required
                className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {passwordVisible ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <input
                type={confirmPasswordVisible ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                required
                className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
              />
              <button
                type="button"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {confirmPasswordVisible ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#00264B] via-[#0173AE] to-[#66C6E6] text-white font-semibold py-2.5 rounded-lg shadow hover:opacity-90 transition"
          >
            Register
          </button>
        </form>

        {/* Extra Link */}
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-[#0173AE] hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
