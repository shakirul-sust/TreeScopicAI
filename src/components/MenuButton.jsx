import React from 'react';
import { motion } from 'framer-motion';

const MenuButton = ({ onClick }) => {
  return (
    <motion.button 
      className="fixed top-5 right-5 z-40 bg-green-700 dark:bg-green-600 
                text-white rounded-full w-10 h-10 flex items-center justify-center 
                shadow-md hover:bg-green-800 dark:hover:bg-green-700 
                transform hover:scale-105 transition-all duration-300
                cursor-pointer"
      onClick={onClick} 
      aria-label="Open menu"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
      
      {/* Glowing effect */}
      <motion.div 
        className="absolute inset-0 rounded-full bg-green-500 opacity-0 blur-md pointer-events-none"
        animate={{ 
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
};

export default MenuButton; 