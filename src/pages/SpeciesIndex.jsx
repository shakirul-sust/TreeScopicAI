import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';

// Sample tree species data (will be replaced with actual data from API/database)
const treeSpeciesData = [
  { scientificName: "Chukrasia tabularis", family: "Meliaceae", localNames: "Chickrasi, Pabba, Dalmara" },
  { scientificName: "Toona ciliata", family: "Meliaceae", localNames: "Toon, Toona" },
  { scientificName: "Swietenia mahagoni", family: "Meliaceae", localNames: "Mahogoni" },
  { scientificName: "Aphanamixis polystachya", family: "Meliaceae", localNames: "Pitraj, Raina, Tiktaraj" },
  { scientificName: "Tectona grandis", family: "Verbenaceae", localNames: "Segun" },
  { scientificName: "Gmelina arborea", family: "Verbenaceae", localNames: "Gamar, Gamari" },
  { scientificName: "Lagerstroemia speciosa", family: "Lythraceae", localNames: "Jarul" },
  { scientificName: "Lagerstroemia parviflora", family: "Lythraceae", localNames: "Sidha jarul, T-jarul" },
  { scientificName: "Michelia champaca", family: "Magnoliaceae", localNames: "Champa" },
  { scientificName: "Albizia procera", family: "Leguminosae", localNames: "Silkoroi" },
  { scientificName: "Artocarpus chaplasha", family: "Moraceae", localNames: "Chapalish, Chambal" },
  { scientificName: "Anthocephalus chinensis", family: "Rubiaceae", localNames: "Kadam" },
  { scientificName: "Dillenia pentagyna", family: "Dilleniaceae", localNames: "Hargoja, Karkotra" },
  { scientificName: "Dipterocarpus turbinatus", family: "Dipterocarpaceae", localNames: "Garjan" },
  { scientificName: "Tetrameles nudiflora", family: "Tetramelaceae", localNames: "Tandul, Chundul, Sandugaza" },
  { scientificName: "Zanthoxylum rhetsa", family: "Rutaceae", localNames: "Bajna, Bajna kanta, Badraang" },
  { scientificName: "Hopea scaphula", family: "Dipterocarpaceae", localNames: "Boilam, Boilshura, Boilshura" },
  { scientificName: "Gynocardia odorata", family: "Flacourtiaceae", localNames: "Chaulmugra, Chhal Mogra" },
  { scientificName: "Mangifera sylvatica", family: "Anacardiaceae", localNames: "Uri-am, Meriam" },
  { scientificName: "Microcos paniculata", family: "Tiliaceae", localNames: "Pisti, Pisli, Asar" },
  { scientificName: "Vitex pinnata", family: "Lamiaceae", localNames: "Badruk, Malayan Teak, Leban" }
];

const SpeciesIndex = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSpecies, setFilteredSpecies] = useState(treeSpeciesData);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle search
  useEffect(() => {
    const results = treeSpeciesData.filter(species => 
      species.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      species.family.toLowerCase().includes(searchTerm.toLowerCase()) ||
      species.localNames.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredSpecies(results);
  }, [searchTerm]);
  
  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton />
      
      <div className="flex flex-col items-center mb-8">
        <motion.h1 
          className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          Tree Species Index
        </motion.h1>
        <motion.p 
          className="text-gray-600 dark:text-gray-300 text-center max-w-2xl"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Browse our comprehensive database of tree species found in Bangladesh forests.
        </motion.p>
      </div>
      
      {/* Search bar */}
      <motion.div 
        className="max-w-md mx-auto mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, family, or local names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 absolute right-3 top-3.5 text-gray-400 dark:text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </motion.div>
      
      {/* Species table */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Scientific Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Family
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Local Names
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSpecies.map((species, index) => (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.2 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <em>{species.scientificName}</em>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {species.family}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {species.localNames}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredSpecies.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No species found matching your search.</p>
              </div>
            )}
            
            <div className="bg-gray-50 dark:bg-gray-700/30 px-6 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredSpecies.length} of {treeSpeciesData.length} tree species
              </p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SpeciesIndex; 