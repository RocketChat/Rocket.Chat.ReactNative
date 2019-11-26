import React from 'react';
import { StyleSheet, Image } from 'react-native';

import StatusBar from '../containers/StatusBar';
import { isAndroid } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%'
	}
});

export default React.memo(withTheme(({ theme }) => (
	<>
		<StatusBar theme={theme} />
		{isAndroid
			? (
				<Image
					source={{ uri: 'launch_screen' }}
					style={[
						styles.image,
						{ backgroundColor: themes[theme].backgroundColor }
					]}
					resizeMode='contain'
				/>
			)
			: null
		}
	</>
)));
