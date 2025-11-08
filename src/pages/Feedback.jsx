import React, { useState } from "react";

const Feedback = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      name: e.target.name.value.trim(),
      email: e.target.email.value.trim(),
      mobile: e.target.mobile.value.trim(),
      feedback: e.target.feedback.value.trim(),
    };

    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
        e.target.reset();
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        console.error("Failed to submit feedback");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00264B] via-[#0173AE] to-[#B0D6E9] p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold text-[#00264B] text-center">SmartDhandha</h1>
        <p className="text-gray-500 text-center mt-1">Feedback</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              required
              className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              placeholder="Enter your mobile number (optional)"
              className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
            />
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Feedback</label>
            <textarea
              name="feedback"
              placeholder="Share your feedback..."
              required
              rows={4}
              className="mt-1 w-full border rounded-lg p-2.5 focus:border-[#0173AE] focus:ring-[#0173AE]"
            ></textarea>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#00264B] via-[#0173AE] to-[#66C6E6] text-white font-semibold py-2.5 rounded-lg shadow hover:opacity-90 transition"
          >
            Submit
          </button>

          {submitted && (
            <p className="text-center text-green-600 font-medium mt-2">
              Feedback submitted successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Feedback;
