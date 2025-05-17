import React from 'react';
import { motion } from 'framer-motion';
import Tooltip from './Tooltip';
import '../styles/MenuButton.css';

const MenuButton = ({ onClick }) => {
  return (
    <Tooltip content="Open Menu" position="left">
      <motion.button 
        className="fixed top-4 right-4 z-40 bg-green-600 dark:bg-green-700 
                  text-white rounded-full w-12 h-12 flex items-center justify-center 
                  shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 
                  transform transition-all duration-300 overflow-hidden"
        onClick={onClick} 
        aria-label="Open menu"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Hamburger icon with white lines */}
        <div className="flex flex-col justify-between h-4 w-5 pointer-events-none">
          <motion.span 
            className="block w-full h-0.5 bg-white rounded-full"
            initial={{ width: '70%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
          <motion.span 
            className="block w-full h-0.5 bg-white rounded-full"
            initial={{ width: '50%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
          <motion.span 
            className="block w-full h-0.5 bg-white rounded-full"
            initial={{ width: '80%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.3, delay: 0.3 }}
          />
        </div>
        
        {/* Ripple effect on click */}
        <span className="absolute w-full h-full pointer-events-none ripple-effect" />
        
        {/* Subtle glowing pulse effect */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-green-500 opacity-0 blur-md pointer-events-none"
          animate={{ 
            opacity: [0, 0.3, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut"
          }}
        />
      </motion.button>
    </Tooltip>
  );
};

export default MenuButton; 