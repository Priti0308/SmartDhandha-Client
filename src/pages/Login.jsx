import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import { jwtDecode } from "jwt-decode"; // <-- 1. Import the new package

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const formData = new FormData(e.target);
    const credentials = Object.fromEntries(formData);

    setIsLoading(true);
    setMessage(null);

    try {
      // 1. You log in and get the token
      const { user, token } = await loginUser(credentials);
      setMessage({ type: "success", text: "Login successful!" });

      // 2. You save the user to your context
      login(user, token);

      // --- THIS IS THE NEW, 100% RELIABLE FIX ---
      // 3. We decode the token itself to find the role.
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role; // Get role from the token

      // 4. Navigate based on the role we just found
      setTimeout(() => {
        if (userRole === 'superadmin') {
          navigate("/superadmin"); // Go to superadmin page
        } else {
          navigate("/dashboard");  // Go to regular user page
        }
      }, 1500); // Wait 1.5 seconds

    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Invalid mobile or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ... (Your JSX remains exactly the same) ...
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00264B] via-[#0173AE] to-[#B0D6E9] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h1 className="text-2xl font-bold text-[#00264B] text-center">
          SmartDhandha
        </h1>
        <p className="text-gray-500 text-center mt-1 text-sm">Welcome Back</p>

        {message && (
          <div
            className={`rounded-lg p-3 text-sm my-4 ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="mt-5 space-y-3" onSubmit={handleLogin}>
          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <input
              type="tel"
              name="mobile"
              placeholder="Enter mobile number"
              required
              className="mt-1 w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0173AE]/50 focus:border-[#0173AE] transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                required
                className="mt-1 w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0173AE]/50 focus:border-[#0173AE] transition-colors"
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

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-[#00264B] via-[#0173AE] to-[#66C6E6] text-white font-semibold py-2 rounded-lg text-sm shadow hover:opacity-90 transition ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Extra Link */}
        <p className="mt-4 text-center text-xs text-gray-500">
          Don’t have an account?{" "}
          <a href="/" className="text-[#0173AE] hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;