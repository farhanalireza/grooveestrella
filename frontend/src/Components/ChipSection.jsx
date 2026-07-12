// ChipSection.jsx
import React, { useState } from 'react';
import Chip from './Chip';
import CategorySelector from './CategorySelector';

const ChipSection = ({ onChipSelect }) => {
  const categories = {
    Moods: [
      "Happy", "Sad", "Romantic", "Melancholy",
      "Focus", "Workout", "Motivational",
      "Instrumental",
    ],
    Genres: [
      "Pop", "Hip Hop", "Electronic", "Rock", "R & B",
      "K-Pop", "Jazz", "Classical", "Blues", "Country"
    ],
    "Editor's Choice": [
      "Trending", "New Releases", "Top 10", "Hidden Gems", "Developer's Choice"
    ]
  };

  const [activeChip, setActiveChip] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Genres");

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setActiveChip(null);
  };

  const handleChipClick = (chipText) => {
    console.log(`Getting ${chipText} recommendation`);
    setActiveChip(chipText);
  };

  return (
    <div className='flex flex-col w-full bg-black/70 z-40 px-4 py-3 sticky top-0 backdrop-blur-md border-b border-white/10'>
      <CategorySelector
        selectedCategory={selectedCategory}
        handleCategoryChange={handleCategoryChange}
      />

      <div className='mt-3 flex overflow-x-auto gap-2 py-1 px-1 chips-container no-scrollbar'>
        {categories[selectedCategory].map((element, index) => (
          <Chip 
            text={element} 
            key={index} 
            isActive={activeChip === element}
            handleClick={() => {
                handleChipClick(element);
                onChipSelect(element);
            }} 
          />
        ))}
      </div>
    </div>
  );
};

export default ChipSection;