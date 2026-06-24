import { View } from 'react-native';
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { isTablet } from '../../lib/methods/helpers';

const SIZE = 96;
const MARGIN_TOP = isTablet ? 0 : 64;
const BORDER_RADIUS = 8;

const styles = StyleSheet.create(theme => ({
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
		borderRadius: BORDER_RADIUS,
		borderColor: theme.colors.strokeLight
	}
}));

interface IServerAvatar {
	url: string;
	image: string;
}

// TODO: missing skeleton
const ServerAvatar = memo(({ url, image }: IServerAvatar) => (
	<View style={styles.container}>{image && <Image style={styles.image} source={{ uri: `${url}/${image}` }} />}</View>
));

export default ServerAvatar;
