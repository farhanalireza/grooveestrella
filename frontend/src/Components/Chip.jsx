import React from 'react';

const Chip = ({ text, handleClick, isActive }) => {
  return (
    <button 
      onClick={handleClick} 
      className={`h-10 min-w-max text-md border-0 rounded-lg inline-flex align-middle justify-center m-2 transition-all duration-200 hover:scale-105 select-none chip
        ${isActive ? 'bg-white text-black border-0 ' : 'bg-black text-white border-1'}`} // Change color if active
    >
      <p>{text}</p>
    </button>
  );
};

export default Chip;

