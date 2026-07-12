// src/Components/CardComponents/ShareTrackComponent.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import GrooveCardComposer from '../GrooveCardComposer';

export const ShareTrackComponent = ({
    trackId,
    title,
    artist,
    url, // album art
    popularity,
    explicit,
    type = "track", // track, album, playlist
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Prevent propagation so card clicks aren't triggered
    const handleButtonClick = (e) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    return (
        <div className="noskip" onClick={(e) => e.stopPropagation()}>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleButtonClick}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 text-white flex items-center justify-center cursor-pointer shadow-md"
                title="Create GrooveCard"
            >
                <Share2 size={16} />
            </motion.button>

            <GrooveCardComposer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                itemId={trackId}
                title={title}
                artist={artist}
                imageUrl={url}
                popularity={popularity}
                explicit={explicit}
                type={type}
            />
        </div>
    );
};