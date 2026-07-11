const getBaseURL = (modulePath = '') => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const base = isLocal ? 'http://localhost:5000/api' : 'https://smartbusiness-rr4o.onrender.com/api';
  return modulePath ? `${base}/${modulePath}` : base;
};

export default getBaseURL;
