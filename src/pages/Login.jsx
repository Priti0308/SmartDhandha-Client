import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { loginUser } from "../services/authService";

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);


  const handleLogin = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const credentials = Object.fromEntries(formData);

  try {
    const response = await loginUser(credentials);
    console.log("Logged in:", response);
    alert("Login successful!");

    // redirect after login
    window.location.href = "/dashboard";
  } catch (err) {
    console.error(err.response?.data || err.message);
    alert("Invalid mobile or password");
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00264B] via-[#0173AE] to-[#B0D6E9] p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-[#00264B] text-center">SmartDhandha</h1>
        <p className="text-gray-500 text-center mt-1">Welcome Back</p>

        <form className="mt-6 space-y-4">
          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input
              type="tel"
              placeholder="Enter mobile number"
              className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter password"
                className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {passwordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
          onClick={handleLogin}
            type="submit"
            className="w-full bg-gradient-to-r from-[#00264B] via-[#0173AE] to-[#66C6E6] text-white font-semibold py-2.5 rounded-lg shadow hover:opacity-90 transition"
          >
            Login
          </button>
        </form>

        {/* Extra Link */}
        <p className="mt-4 text-center text-sm text-gray-500">
          Don’t have an account?{" "}
          <a href="/register" className="text-[#0173AE] hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
