import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export default () => {
	const [dimensions, setDimensions] = useState(Dimensions.get('window'));

	const onChange = ({
		window: {
			width,
			height,
			scale,
			fontScale
		}
	}) => setDimensions({
		width,
		height,
		scale,
		fontScale
	});

	useEffect(() => {
		Dimensions.addEventListener('change', onChange);
		return () => Dimensions.removeEventListener('change', onChange);
	}, []);

	return dimensions;
};
