import React, { useCallback, useEffect } from 'react';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';
import { useTheme } from '../../theme';
import Touch from '../../utils/touch';

const LoadMore = ({ load, item, auto }) => {
	const { theme } = useTheme();
	const handleLoad = useCallback(() => load(item));

	useEffect(() => {
		console.log('🚀 ~ file: LoadMore.js ~ line 14 ~ useEffect ~ auto', auto);
		if (auto) {
			handleLoad();
		}
	}, []);

	return (
		<Touch
			onPress={handleLoad}
			style={{ height: 50, backgroundColor: themes[theme].actionTintColor, alignItems: 'center', justifyContent: 'center' }}
			theme={theme}
		>
			<Text style={{ color: themes[theme].buttonText, fontSize: 30 }}>+</Text>
		</Touch>
	);
};

export default LoadMore;
