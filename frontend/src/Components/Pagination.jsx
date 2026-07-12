// src/components/Pagination.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../lib/apiClient';

const Pagination = ({ currentPage, totalPages, prevUrl, nextUrl, getDataFromDB }) => (
  <div className="pagination-wrapper flex flex-col items-center gap-3 mt-4">
    <div className="flex justify-center items-center mb-3">
      <div className="w-25 h-0.5 bg-white md:w-50 lg:w-75 xl:w-100"></div>
      <div className="mx-5 text-white">PAGINATION</div>
      <div className="w-25 h-0.5 bg-white md:w-50 lg:w-75 xl:w-100"></div>
    </div>

    <div className="flex items-center gap-4">
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className="text-black bg-white rounded-lg px-4 py-2 disabled:opacity-50"
        disabled={!prevUrl}
        onClick={() => getDataFromDB(prevUrl)}
      >
        ⬅ Prev
      </motion.button>

      <p className="text-white text-center">
        Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
      </p>

      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className="text-black bg-white rounded-lg px-4 py-2 disabled:opacity-50"
        disabled={!nextUrl}
        onClick={() => getDataFromDB(nextUrl)}
      >
        Next ➡
      </motion.button>
    </div>

    <div className="flex flex-wrap justify-center gap-2 text-white m-5">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
        const offset = (pageNum - 1) * 10;
        const pageUrl = `${API_BASE_URL}/songs?offset=${offset}&limit=10`;

        return (
          <motion.button
            key={pageNum}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className={`px-3 py-1 rounded-md font-semibold transition-all duration-200 ${
              currentPage === pageNum ? "bg-yellow-400 text-black" : "bg-gray-800 text-white hover:bg-gray-600"
            }`}
            onClick={() => getDataFromDB(pageUrl)}
          >
            {pageNum}
          </motion.button>
        );
      })}
    </div>
  </div>
);

export default Pagination;
