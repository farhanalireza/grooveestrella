// PlaylistTracks.jsx
import React from 'react';
import { TrackCard } from './CardComponents/TracksCard';

const PlaylistTracks = ({ tracks }) => {
    return (
        <div className="flex flex-row flex-wrap justify-center gap-5">
            {tracks.map((item, idx) => (
                <TrackCard
                    key={idx}
                    url={item.track.album.images[0]?.url}
                    title={item.track.name}
                    artist={item.track.artists.map(a => a.name).join(', ')}
                    album={item.track.album?.name || ''}
                    trackId={item.track.id}
                    popularity={item.track.popularity}
                    explicit={item.track.explicit}
                    trackURI={item.track.uri}
                    YTURL={`https://www.youtube.com/results?search_query=${item.track.name} ${item.track.artists.map(a => a.name).join(', ')}`}
                    spoURL={item.track.external_urls?.spotify}
                />
            ))}
        </div>
    );
};

export default PlaylistTracks;
