import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { isTablet } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import Skeleton from '../../containers/Skeleton/Skeleton';

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
	url: string;
	image: string;
}

// TODO: missing skeleton
const ServerAvatar = React.memo(({ url, image }: IServerAvatar) => {
	const { colors } = useTheme();
	const [loading, setLoading] = React.useState(true);

	return (
		<View style={styles.container}>
			{loading ? <Skeleton width={SIZE} height={SIZE} borderRadius={BORDER_RADIUS} /> : null}
			{image && (
				<Image
					style={[styles.image, { borderColor: colors.strokeLight }, loading && { width: 0, height: 0 }]}
					source={{ uri: `${url}/${image}` }}
					onLoadEnd={() => setLoading(false)}
				/>
			)}
		</View>
	);
});

export default ServerAvatar;
