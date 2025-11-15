import React, { useState, useEffect } from "react";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

// 🚀 IMPORTANT: Ensure this path is correct for your project structure.
import { registerUser } from "../services/authService"; 

const Register = () => {
    const navigate = useNavigate();
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    
    const [formData, setFormData] = useState({
        fullName: "",
        businessName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [passwordError, setPasswordError] = useState("");

    // Effect to check if passwords match
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Check for password match error
        if (passwordError) {
            setMessage({ type: "error", text: "Please ensure your passwords match." });
            return;
        }

        // 2. Comprehensive form validation
        const { fullName, businessName, email, mobile, password } = formData;
        if (!fullName || !businessName || !email || !mobile || !password) {
            setMessage({ type: "error", text: "Please fill all required fields." });
            return;
        }

        setIsLoading(true);
        setMessage(null);
        
        // --- CRITICAL CORRECTION HERE ---
        // Destructure to create a clean payload, EXCLUDING confirmPassword
        const { confirmPassword, ...dataToSend } = formData;

        try {
            // 🚨 REAL API CALL 🚨
            const response = await registerUser(dataToSend); 
            
            setMessage({
                type: "success",
                // Updated message to reflect pending approval
                text: response.message || "Registration successful! Pending Admin Approval...",
            });
            
            // Store token and redirect
            localStorage.setItem("authToken", response.token); 
            setTimeout(() => navigate("/dashboard"), 2000);
            
        } catch (err) {
            // Handle registration errors (e.g., duplicate mobile/email)
            let errorText = "Registration failed. Please try again.";
            if (err.response && err.response.data && err.response.data.message) {
                errorText = err.response.data.message;
            } else if (err.message) {
                // For network/CORS errors
                errorText = `Network Error: ${err.message}`;
            }

            setMessage({ type: "error", text: errorText });
            
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00264B] via-[#0173AE] to-[#B0D6E9] p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
                <h1 className="text-2xl font-bold text-[#00264B] text-center">
                    SmartDhandha
                </h1>
                <p className="text-sm text-gray-500 text-center mt-1">
                    Create Your Business Account
                </p>
                
                {/* Message Alert Display */}
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
                    
                    {/* Full Name Input */}
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Full Name"
                        required
                        className="mt-1 w-full border rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    {/* Business Name Input */}
                    <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Business Name"
                        required
                        className="mt-1 w-full border rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />

                    {/* Email Input (now a regular field) */}
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        required
                        className="mt-1 w-full border rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    {/* Mobile Number Input */}
                    <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="10-digit Mobile Number"
                        pattern="[0-9]{10}"
                        required
                        className="mt-1 w-full border rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    {/* Password Input */}
                    <div className="relative">
                        <input
                            type={passwordVisible ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            required
                            className="mt-1 w-full border rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                            {passwordVisible ? <HiEyeSlash /> : <HiEye />}
                        </button>
                    </div>
                    
                    {/* Confirm Password Input */}
                    <div className="relative">
                        <input
                            type={confirmPasswordVisible ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm Password"
                            required
                            className="mt-1 w-full border rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                            {confirmPasswordVisible ? <HiEyeSlash /> : <HiEye />}
                        </button>
                    </div>
                    {passwordError && (
                        <p className="text-xs text-red-600 mt-1">{passwordError}</p>
                    )}
                    
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !!passwordError}
                        className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>
                
                {/* Login Link */}
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