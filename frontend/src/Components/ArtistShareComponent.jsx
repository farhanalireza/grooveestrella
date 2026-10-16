// src/Components/ArtistShareComponent.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import GrooveCardComposer from './GrooveCardComposer';

export const ShareArtistComponent = ({
    artistId,
    name,
    artistName,
    imageUrl,
    followers,
    popularity,
    genres = []
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const finalName = name || artistName || 'Artist';

    // Prevent propagation so card clicks aren't triggered
    const handleButtonClick = (e) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    // Subtitle displays followers or top genres
    const genreSubtitle = genres.length > 0 
        ? genres.slice(0, 3).join(', ') 
        : `${followers?.toLocaleString() || 0} Followers`;

    return (
        <div className="noskip" onClick={(e) => e.stopPropagation()}>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleButtonClick}
                className="p-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] hover:text-[var(--theme-accent)] transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md"
                title="Create GrooveCard"
            >
                <Share2 size={16} />
            </motion.button>

            <GrooveCardComposer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                itemId={artistId}
                title={finalName}
                artist={genreSubtitle}
                imageUrl={imageUrl}
                popularity={popularity}
                explicit={false}
                type="artist"
                genres={genres}
            />
        </div>
    );
};