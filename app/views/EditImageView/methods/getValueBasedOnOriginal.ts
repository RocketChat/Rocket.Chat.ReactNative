const getValueBasedOnOriginal = (cuttedValue: number, originalSize: number, screenScale: number) => {
	const scale = originalSize / screenScale;
	return cuttedValue * scale;
};

export default getValueBasedOnOriginal;
