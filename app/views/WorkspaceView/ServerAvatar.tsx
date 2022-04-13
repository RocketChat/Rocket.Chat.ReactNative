import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import FastImage from '@rocket.chat/react-native-fast-image';

import sharedStyles from '../Styles';
import { themes } from '../../lib/constants';
import { isTablet } from '../../utils/deviceInfo';
import { TSupportedThemes } from '../../theme';

const ImageProgress = createImageProgress(FastImage);

const SIZE = 96;
const MARGIN_TOP = isTablet ? 0 : 64;
const BORDER_RADIUS = 6;

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
		width: '100%',
		height: SIZE + MARGIN_TOP,
		justifyContent: 'flex-end',
		alignItems: 'center'
	},
	image: {
		width: SIZE,
		height: SIZE,
		borderRadius: BORDER_RADIUS
	},
	fallback: {
		width: SIZE,
		height: SIZE,
		borderRadius: BORDER_RADIUS,
		alignItems: 'center',
		justifyContent: 'center'
	},
	initial: {
		...sharedStyles.textBold,
		fontSize: 42
	}
});

const getInitial = (url: string) => url && url.replace(/http(s?):\/\//, '').slice(0, 1);

interface IFallback {
	theme: TSupportedThemes;
	initial: string;
}
const Fallback = ({ theme, initial }: IFallback) => (
	<View style={[styles.container, styles.fallback, { backgroundColor: themes[theme].dangerColor }]}>
		<Text style={[styles.initial, { color: themes[theme].buttonText }]}>{initial}</Text>
	</View>
);

interface IServerAvatar {
	theme: TSupportedThemes;
	url: string;
	image: string;
}
const ServerAvatar = React.memo(({ theme, url, image }: IServerAvatar) => (
	<View style={styles.container}>
		{image && (
			<ImageProgress
				style={[styles.image, { borderColor: themes[theme].borderColor }]}
				source={{ uri: `${url}/${image}` }}
				resizeMode={FastImage.resizeMode.cover}
				indicator={Progress.Pie}
				indicatorProps={{
					color: themes[theme].actionTintColor
				}}
				renderError={() => <Fallback theme={theme} initial={getInitial(url)} />}
			/>
		)}
	</View>
));

ServerAvatar.displayName = 'ServerAvatar';

export default ServerAvatar;
