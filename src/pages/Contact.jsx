import React, { useState } from 'react';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear the error for this field when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    return errors;
  };

  const checkInternetConnection = () => {
    return navigator.onLine;
  };

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: '', message: '' });
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    if (!checkInternetConnection()) {
      showToast('error', 'Internet connection not found. Please try again when you\'re online.');
      setIsSubmitting(false);
      return;
    }

    try {
      // In a real app, you would send the data to a server here
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form after successful submission
      setFormData({ name: '', email: '', subject: '', message: '' });
      showToast('success', 'Message sent successfully! We\'ll get back to you soon.');
    } catch (error) {
      showToast('error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 full-page-view reset-stacking-context"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton />

      {/* Toast notification */}
      {toast.show && (
        <motion.div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white max-w-md`}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p>{toast.message}</p>
          </div>
        </motion.div>
      )}
      
      <div className="flex flex-col items-center mb-12">
        <motion.h1 
          className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          Contact Us
        </motion.h1>
        <motion.p 
          className="text-gray-600 dark:text-gray-300 text-center max-w-2xl"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Get in touch with the TreeScopeAI team for support, feedback, or collaboration opportunities
        </motion.p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Email Contact */}
          <motion.a
            href="mailto:shakirul.sust@gmail.com"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6
                      hover:shadow-xl transition-shadow duration-300
                      border-t-4 border-blue-500"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Email</h2>
              <p className="text-blue-600 dark:text-blue-400 font-medium">shakirul.sust@gmail.com</p>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                For general inquiries, support requests, and feedback
              </p>
            </div>
          </motion.a>
          
          {/* LinkedIn */}
          <motion.a
            href="https://www.linkedin.com/in/shakirul-sust"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6
                      hover:shadow-xl transition-shadow duration-300
                      border-t-4 border-blue-700"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-700 dark:text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">LinkedIn</h2>
              <p className="text-blue-700 dark:text-blue-500 font-medium">shakirul-sust</p>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                Connect with our development team professionally
              </p>
            </div>
          </motion.a>
          
          {/* Facebook */}
          <motion.a
            href="https://www.facebook.com/shakirul.sust"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6
                      hover:shadow-xl transition-shadow duration-300
                      border-t-4 border-blue-600"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Facebook</h2>
              <p className="text-blue-600 dark:text-blue-400 font-medium">shakirul.sust</p>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                Follow us for updates, tips, and community discussions
              </p>
            </div>
          </motion.a>
        </div>
        
        {/* Contact Form */}
        <motion.div 
          className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden relative z-10 form-fix-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
              Send Us a Message
            </h2>
            
            <form className="space-y-6 relative z-20 allow-interaction" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border relative z-20 ${formErrors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} 
                              bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                              focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400`}
                    placeholder="John Doe"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border relative z-20 ${formErrors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} 
                              bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                              focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400`}
                    placeholder="john@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{formErrors.email}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border relative z-20 ${formErrors.subject ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} 
                            bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                            focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400`}
                  placeholder="How can we help you?"
                />
                {formErrors.subject && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{formErrors.subject}</p>
                )}
              </div>
              
              <div className="relative z-30 allow-interaction"> {/* Even higher z-index for the textarea */}
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border relative z-30 allow-interaction ${formErrors.message ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} 
                            bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                            focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400`}
                  placeholder="Write your message here..."
                  style={{ position: 'relative', zIndex: 30 }}
                ></textarea>
                {formErrors.message && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{formErrors.message}</p>
                )}
              </div>
              
              <div className="flex justify-center relative z-20 allow-interaction">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 
                            hover:from-green-600 hover:to-blue-600 
                            text-white rounded-lg shadow-md relative z-20 allow-interaction
                            flex items-center justify-center
                            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'transition-colors duration-200'}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
        
        {/* Office Location */}
        <motion.div 
          className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Shahjalal University of Science and Technology
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Kumargaon, Sylhet-3114, Bangladesh
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Department of Forestry and Environmental Science
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Contact; 