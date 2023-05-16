import React from 'react';
import { BlurView } from '@react-native-community/blur';
import { View, ViewStyle } from 'react-native';

import RCActivityIndicator from '../../ActivityIndicator';
import { CustomIcon } from '../../CustomIcon';
import { useTheme } from '../../../theme';

const BlurComponent = ({ loading = false, style }: { loading: boolean; style: ViewStyle }) => {
	const { theme, colors } = useTheme();

	return (
		<>
			<BlurView
				style={[style, { position: 'absolute', borderWidth: 0, top: 0, left: 0, bottom: 0, right: 0 }]}
				blurType={theme === 'light' ? 'light' : 'dark'}
				blurAmount={10}
				reducedTransparencyFallbackColor='white'
			/>
			<View style={[style, { position: 'absolute', justifyContent: 'center', alignItems: 'center', borderWidth: 0 }]}>
				{loading ? <RCActivityIndicator /> : <CustomIcon color={colors.buttonText} name='arrow-down-circle' size={54} />}
			</View>
		</>
	);
};

export default BlurComponent;
