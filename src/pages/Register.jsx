import React, { useState, useEffect } from "react";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { sendOtp, registerUser } from "../services/authService"; 

const Register = () => {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      setPasswordError("Passwords do not match.");
    } else {
      setPasswordError("");
    }
  }, [formData.password, formData.confirmPassword]);

  useEffect(() => {
    if (!timeLeft) return;
    const interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (isSendingOtp || !formData.email) return;
    setIsSendingOtp(true);
    setMessage(null);
    try {
      await sendOtp(formData.email);
      setMessage({
        type: "success",
        text: "OTP sent successfully to your email.",
      });
      setOtpSent(true);
      setTimeLeft(120);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordError) {
      setMessage({
        type: "error",
        text: "Please ensure your passwords match.",
      });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await registerUser(formData);
      setMessage({
        type: "success",
        text: "Registration successful! Redirecting...",
      });
      localStorage.setItem("authToken", response.token);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00264B] via-[#0173AE] to-[#B0D6E9] p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <h1 className="text-2xl font-bold text-[#00264B] text-center">
          SmartDhandha
        </h1>
        <p className="text-sm text-gray-500 text-center mt-1">
          Create Your Business Account
        </p>
        {message && (
          <div
            className={`rounded-lg p-3 text-sm my-4 text-center ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          {/* Form fields */}
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          />
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="Business Name"
            required
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          />
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="10-digit Mobile Number"
            pattern="[0-9]{10}"
            required
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          />
          <div className="relative">
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="mt-1 w-full border rounded-lg p-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {passwordVisible ? <HiEyeSlash /> : <HiEye />}
            </button>
          </div>
          <div className="relative">
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
              className="mt-1 w-full border rounded-lg p-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {confirmPasswordVisible ? <HiEyeSlash /> : <HiEye />}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-600 mt-1">{passwordError}</p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email for Verification"
              required
              className="mt-1 flex-1 border rounded-lg p-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={isSendingOtp || timeLeft > 0 || !formData.email}
              className="px-3 py-2 mt-1 text-sm font-semibold rounded-lg transition whitespace-nowrap bg-gray-200 disabled:cursor-not-allowed"
            >
              {isSendingOtp
                ? "..."
                : timeLeft > 0
                ? `Resend (${formatTime(timeLeft)})`
                : "Send OTP"}
            </button>
          </div>
          {otpSent && (
            <div className="space-y-1 pt-1">
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="6-digit OTP"
                required
                className="w-full border rounded-lg p-2 text-sm"
                disabled={!timeLeft}
              />
              <p className="text-xs text-gray-500 text-right">
                {timeLeft > 0
                  ? `Expires in ${formatTime(timeLeft)}`
                  : "OTP expired."}
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading || !otpSent || !!passwordError}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Account
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-gray-500">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Login Now
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
