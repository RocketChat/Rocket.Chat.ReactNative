const getHorizontalPadding = (width: number, resizedWidth: number) => {
	const spaceToAlign = width - resizedWidth;
	return spaceToAlign / 2;
};

export default getHorizontalPadding;
