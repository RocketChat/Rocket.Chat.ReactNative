import sdk from './sdk';

// RC 0.64.0
const toggleFavorite = (roomId: string, favorite: boolean) => sdk.post('rooms.favorite', { roomId, favorite });

export default toggleFavorite;
