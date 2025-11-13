import React, { useState } from "react";
import { Link } from "react-router-dom";
// import ../assets/images/business.png as business;
import business from "../assets/images/business-2.png";
import {
  FaBook,
  FaBoxOpen,
  FaUserCheck,
  FaChartLine,
  FaShieldAlt,
  FaHeadset,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaBars, // Hamburger Icon
  FaTimes, // Close Icon
  FaQuoteLeft, // Quote Icon
} from "react-icons/fa";

// --- Integrated & Responsive Navbar Component ---
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = (
    <>
      <Link
        to="/contact"
        className="text-gray-600 hover:text-[#00528B] transition-colors duration-200 font-medium px-3 py-2 rounded-lg"
        onClick={() => setIsMenuOpen(false)}
      >
        Contact
      </Link>
      <Link
        to="/feedback"
        className="text-gray-600 hover:text-[#00528B] transition-colors duration-200 font-medium px-3 py-2 rounded-lg"
        onClick={() => setIsMenuOpen(false)}
      >
        Feedback
      </Link>
      <Link
        to="/help"
        className="text-gray-600 hover:text-[#00528B] transition-colors duration-200 font-medium px-3 py-2 rounded-lg"
        onClick={() => setIsMenuOpen(false)}
      >
        Help
      </Link>
      <Link
        to="/login"
        className="text-gray-600 hover:text-[#00528B] transition-colors duration-200 font-medium px-3 py-2 rounded-lg"
        onClick={() => setIsMenuOpen(false)}
      >
        Login
      </Link>
      
      <Link
        to="/register"
        className="px-4 py-2 bg-[#00528B] text-white rounded-lg font-semibold hover:bg-[#003B6F] transition-colors duration-200"
        onClick={() => setIsMenuOpen(false)}
      >
        Sign Up
      </Link>
    </>
  );

  return (
    <nav className="bg-white/95 shadow-md fixed w-full z-20 top-0 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Brand Logo/Name */}
          <Link to="/" className="text-2xl font-bold text-[#003B6F]">
            SmartDhandha
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">{navLinks}</div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <FaTimes className="w-6 h-6 text-gray-700" />
              ) : (
                <FaBars className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <div className="flex flex-col items-center space-y-4">{navLinks}</div>
          </div>
        )}
      </div>
    </nav>
  );
};


// --- Main Home Landing Page Component ---
const Home = () => {
  const features = [
    {
      icon: <FaBook className="w-10 h-10 mb-4 text-[#007AB8]" />,
      title: "Digital Ledger (Khata)",
      desc: "Effortlessly record credit (Jama) and debit (Udhar) transactions for all your customers. Say goodbye to paper ledgers.",
    },
    {
      icon: <FaBoxOpen className="w-10 h-10 mb-4 text-[#007AB8]" />,
      title: "Inventory & Invoicing",
      desc: "Manage your stock, create professional GST invoices, and track your business sales and purchases in one place.",
    },
    {
      icon: <FaUserCheck className="w-10 h-10 mb-4 text-[#007AB8]" />,
      title: "Visitor Management",
      desc: "Securely check-in visitors, manage appointments, and maintain a digital log of everyone who enters your premises.",
    },
     {
      icon: <FaChartLine className="w-10 h-10 mb-4 text-[#007AB8]" />,
      title: "Business Reports",
      desc: "Get real-time insights into your business with powerful reports on sales, inventory, and cash flow.",
    },
     {
      icon: <FaShieldAlt className="w-10 h-10 mb-4 text-[#007AB8]" />,
      title: "Data Security",
      desc: "Your business data is 100% safe and secure with automatic backups, ensuring you never lose important information.",
    },
     {
      icon: <FaHeadset className="w-10 h-10 mb-4 text-[#007AB8]" />,
      title: "24/7 Support",
      desc: "Our dedicated support team is always available to help you with any questions or issues you may have.",
    },
  ];

  const testimonials = [
    {
      name: "Ravi Patel",
      role: "Retail Store Owner",
      text: "SmartDhandha has completely transformed how I manage my shop. The digital khata and inventory are lifesavers!",
    },
    {
      name: "Anita Sharma",
      role: "Boutique Manager",
      text: "Creating invoices and tracking visitors is so simple now. The interface is clean and very easy to use. Highly recommended!",
    },
    {
      name: "Vikas Jain",
      role: "Factory Supervisor",
      text: "We switched to SmartDhandha for visitor management and ended up using all its features. Best decision for our company.",
    },
  ];

  return (
    <div className="bg-white overflow-x-hidden"> {/* Prevent horizontal scroll */}
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative bg-gradient-to-br from-[#002244] via-[#003B6F] to-[#00528B] text-white min-h-screen flex items-center pt-24 md:pt-20">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-50px] left-[-50px] w-72 h-72 bg-[#007AB8]/10 rounded-full mix-blend-screen animate-blob"></div>
        <div className="absolute top-1/4 right-[-80px] w-96 h-96 bg-[#66B2FF]/10 rounded-full mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-30px] left-1/3 w-64 h-64 bg-[#007AB8]/10 rounded-full mix-blend-screen animate-blob animation-delay-4000"></div>
        {/* -- New small circles -- */}
        <div className="absolute top-1/2 left-[-100px] w-32 h-32 bg-[#66B2FF]/10 rounded-full mix-blend-screen animate-blob animation-delay-1000"></div>
        <div className="absolute bottom-[-80px] right-[-50px] w-80 h-80 bg-[#007AB8]/10 rounded-full mix-blend-screen animate-blob animation-delay-3000"></div>
        <div className="absolute top-20 right-20 w-40 h-40 bg-[#66B2FF]/10 rounded-full mix-blend-screen animate-blob animation-delay-5000"></div>
        <div className="absolute bottom-24 right-1/3 w-24 h-24 bg-[#007AB8]/10 rounded-full mix-blend-screen animate-blob animation-delay-7000"></div>
        {/* -- Added two more blobs -- */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-[#007AB8]/10 rounded-full mix-blend-screen animate-blob animation-delay-9000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#66B2FF]/10 rounded-full mix-blend-screen animate-blob animation-delay-11000"></div>


        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between z-10">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left mb-10 md:mb-0 animate-fadeInUp">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4">
              The Smart Way to Manage Your Business
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl mx-auto md:mx-0">
              SmartDhandha is the all-in-one solution combining a digital ledger, inventory management, and visitor tracking to streamline your operations.
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-gradient-to-r from-white to-gray-200 text-[#003B6F] font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Get Started for Free
            </Link>
          </div>

          {/* Illustration */}
          <div className="flex-1 flex justify-center md:justify-end animate-fadeInRight">
            <img
              src={business}
              alt="Business Management Illustration"
              className="w-full max-w-sm md:max-w-md lg:max-w-lg object-contain rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* --- ALL-IN-ONE SOLUTION SECTION --- */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50"> {/* Added Gradient Background */}
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#002244] mb-4 animate-fadeInUp">
                One App for All Your Business Needs
            </h2>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto animate-fadeInUp delay-200">
                We've combined the power of a ledger, invoicing software, and a visitor system into one simple platform.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 animate-fadeInUp delay-300">
                    <div className="text-5xl text-[#007AB8] mb-4 flex justify-center"><FaBook /></div>
                    <h3 className="text-xl font-semibold mb-2 text-[#003B6F]">Khatabook Power</h3>
                    <p className="text-gray-600">Manage customer accounts and track payments with a digital ledger.</p>
                </div>
                 <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 animate-fadeInUp delay-500">
                    <div className="text-5xl text-[#007AB8] mb-4 flex justify-center"><FaBoxOpen /></div>
                    <h3 className="text-xl font-semibold mb-2 text-[#003B6F]">Vyapar Simplicity</h3>
                    <p className="text-gray-600">Create invoices, manage stock, and monitor your business health.</p>
                </div>
                 <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 animate-fadeInUp delay-700">
                    <div className="text-5xl text-[#007AB8] mb-4 flex justify-center"><FaUserCheck /></div>
                    <h3 className="text-xl font-semibold mb-2 text-[#003B6F]">Visitor Security</h3>
                    <p className="text-gray-600">Keep a secure, digital record of every visitor to your workplace.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-[#002244] animate-fadeInUp">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="text-left p-8 bg-gray-50 rounded-xl shadow-md border border-gray-100 hover:shadow-2xl hover:-translate-y-2 hover:border-[#007AB8] transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                {feature.icon}
                <h3 className="text-xl font-bold text-[#003B6F] mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-[#002244] animate-fadeInUp text-center">
            Loved by Business Owners Across India
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-lg shadow-lg text-left border border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-fadeInUp"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <FaQuoteLeft className="text-2xl text-gray-300 mb-4" />
                <p className="text-gray-600 italic mb-6">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#003B6F] to-[#66B2FF] flex items-center justify-center text-white font-bold text-xl mr-4 flex-shrink-0">
                        {testimonial.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-[#003B6F]">{testimonial.name}</h4>
                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CALL TO ACTION SECTION --- */}
      <section className="bg-gradient-to-r from-[#002244] to-[#003B6F] text-white py-16 lg:py-20 text-center">
         <div className="container mx-auto px-6 animate-fadeInUp">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Digitize Your Dhandha?
            </h2>
            <p className="mb-8 text-lg text-gray-300 max-w-2xl mx-auto">
            Join thousands of businesses growing with SmartDhandha. It's free to get started.
            </p>
            <Link
            to="/register"
            className="inline-block px-10 py-4 bg-gradient-to-r from-white to-gray-200 text-[#003B6F] font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
            Start Managing Smarter
            </Link>
         </div>
      </section>

      {/* --- INTEGRATED FOOTER --- */}
      <footer className="bg-[#001122] text-gray-400">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-white font-bold text-2xl mb-2">SmartDhandha</h3>
              <p className="text-sm">
                The all-in-one solution to digitize and grow your business.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors duration-200">Features</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors duration-200">Sign Up</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors duration-200">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white transition-colors duration-200">Contact Us</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors duration-200">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200"><FaFacebookF size={20} /></a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200"><FaTwitter size={20} /></a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200"><FaLinkedinIn size={20} /></a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200"><FaInstagram size={20} /></a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Prarambh Pvt.Ltd All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        /* Adjusted animation delays for the new blobs as well */
        .animation-delay-1000 { animation-delay: -1s; }
        .animation-delay-2000 { animation-delay: -2s; }
        .animation-delay-3000 { animation-delay: -3s; }
        .animation-delay-4000 { animation-delay: -4s; }
        .animation-delay-5000 { animation-delay: -5s; }
        .animation-delay-7000 { animation-delay: -7s; }
        .animation-delay-9000 { animation-delay: -9s; } /* New blob 1 */
        .animation-delay-11000 { animation-delay: -11s; } /* New blob 2 */

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0; /* Start hidden */
        }
        
        @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInRight {
            animation: fadeInRight 0.8s ease-out forwards;
            opacity: 0; /* Start hidden */
        }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-700 { animation-delay: 0.7s; }
        
        .animate-fadeInUp[style*="animation-delay"] {
             opacity: 0; /* Keep hidden until animation starts */
        }
      `}</style>
    </div>
  );
};

export default Home;