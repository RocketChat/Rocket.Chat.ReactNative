const getValueBasedOnOriginal = (cuttedValue: number, originalSize: number, screenScale: number) => {
	if (screenScale === 0) throw new Error('screenScale cannot be zero');
	const scale = originalSize / screenScale;
	return cuttedValue * scale;
};

export default getValueBasedOnOriginal;
