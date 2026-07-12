import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SavedAlbums = ({ albums, onSelectAlbum }) => {
    const router = useRouter();
  const [hasAlbums, setHasAlbums] = useState([]);
  console.log(albums);
  
    function openArtist(id) {
        router.push(`/artist/${id}`);
    }

    function openAlbum(id) {
        router.push(`/album/${id}`);
    }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {albums.map((album, index) => (
        <div
          key={album.id || index}
          className="cursor-pointer bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition"
        >
          <img
            src={album.album.images[0].url}
            alt={album.album.name}
            className="rounded mb-2 w-full h-auto object-cover"
          />
          <div className="font-semibold" onClick={() => openAlbum(album.album.id)}>{album.album.name}</div>
          <div className="text-sm text-gray-400" onClick={() => {
            openArtist(album.album.artists[0].id)
          }}>{album.album.artists[0].name}</div>
        </div>
      ))}
    </div>
  );
};

export default SavedAlbums;
