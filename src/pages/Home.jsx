import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white min-h-screen flex items-center pt-20">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fadeInUp">
              Manage Your Business Smartly with{" "}
              <span className="text-[#A7E1FF]">SmartDhandha</span>
            </h1>
            <p className="text-lg mb-8 opacity-90 animate-fadeInUp delay-200">
              All-in-one solution for your Ledger, Inventory, and Visitor
              Management. Streamline operations, save time, and grow faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                to="/register"
                className="px-6 py-3 bg-[#0096D6] text-white font-semibold rounded-lg hover:bg-[#007AB8] transition"
              >
                Get Started
              </Link>
              <Link
                to="/features"
                className="px-6 py-3 border border-white font-semibold rounded-lg hover:bg-white hover:text-[#003B6F] transition"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex-1 mt-10 md:mt-0">
            <img
              src="https://img.freepik.com/free-vector/hand-drawn-flat-design-business-strategy-concept_23-2149190166.jpg"
              alt="Business Illustration"
              className="w-full animate-fadeInRight"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8 text-center">
          {[
            { number: "8+", label: "Years Experience" },
            { number: "500+", label: "Happy Clients" },
            { number: "1200+", label: "Projects Delivered" },
            { number: "24/7", label: "Customer Support" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <h3 className="text-4xl font-bold text-[#0066A3]">{stat.number}</h3>
              <p className="mt-2 text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12 text-[#003B6F]">
            Why Choose SmartDhandha?
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                title: "📒 Smart Ledger",
                desc: "Track transactions with advanced filtering and reporting features.",
              },
              {
                title: "📦 Inventory Management",
                desc: "Manage stock, purchases, and sales seamlessly.",
              },
              {
                title: "👥 Visitor Management",
                desc: "Track visitors and clients with integrated check-in tools.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12 text-[#003B6F]">
            What Our Clients Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Ravi Patel",
                text: "SmartDhandha has completely transformed the way we manage our business.",
              },
              {
                name: "Anita Sharma",
                text: "Easy to use, powerful features, and great customer support!",
              },
              {
                name: "Vikas Jain",
                text: "Best decision we made for our growing company.",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <p className="text-gray-600 italic mb-4">
                  "{testimonial.text}"
                </p>
                <h4 className="font-bold text-[#0066A3]">{testimonial.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to take your business to the next level?
        </h2>
        <p className="mb-8 text-lg opacity-90">
          Join thousands of businesses already using SmartDhandha.
        </p>
        <Link
          to="/register"
          className="px-8 py-4 bg-white text-[#003B6F] font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          Get Started Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-[#002244] text-gray-300 py-10">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-xl mb-4">SmartDhandha</h3>
            <p>Your trusted partner for business management solutions.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul>
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/features" className="hover:underline">Features</Link></li>
              <li><Link to="/pricing" className="hover:underline">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
              <li><Link to="/faq" className="hover:underline">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <p>Social icons here...</p>
          </div>
        </div>
        <div className="text-center mt-10 border-t border-gray-700 pt-6">
          © {new Date().getFullYear()} SmartDhandha. All rights reserved.
        </div>
      </footer>
    </>
  );
};

export default Home;
