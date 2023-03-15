import React from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { themes } from '../../lib/constants';
import { isTablet } from '../../lib/methods/helpers';
import { TSupportedThemes } from '../../theme';

const SIZE = 96;
const MARGIN_TOP = isTablet ? 0 : 64;
const BORDER_RADIUS = 8;

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
	}
});

interface IServerAvatar {
	theme: TSupportedThemes;
	url: string;
	image: string;
}

// TODO: missing skeleton
const ServerAvatar = React.memo(({ theme, url, image }: IServerAvatar) => (
	<View style={styles.container}>
		{image && (
			<FastImage style={[styles.image, { borderColor: themes[theme].borderColor }]} source={{ uri: `${url}/${image}` }} />
		)}
	</View>
));

ServerAvatar.displayName = 'ServerAvatar';

export default ServerAvatar;
