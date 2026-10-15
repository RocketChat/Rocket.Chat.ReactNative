const BACKDROP_TINTS = ['#5f141480', '#1a3a5f80', '#145f2a80', '#5f4a1480', '#3a145f80'];

const HASH_MULTIPLIER = 31;

export const backdropTint = (name: string): string => {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash * HASH_MULTIPLIER + name.charCodeAt(i)) | 0;
	}
	return BACKDROP_TINTS[Math.abs(hash) % BACKDROP_TINTS.length];
};
