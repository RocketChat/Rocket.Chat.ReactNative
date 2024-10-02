import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getThumbnailAsync } from 'expo-video-thumbnails';
import FastImage from 'react-native-fast-image';

import { CustomIcon } from '../../../CustomIcon';
import OverlayComponent from '../OverlayComponent';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	overlay: {
		flex: 1
	},
	image: {
		width: '100%',
		height: '100%'
	},
	playerIcon: {
		position: 'absolute',
		shadowColor: '#000',
		shadowOpacity: 0.3,
		shadowOffset: {
			width: 1,
			height: 1
		}
	}
});

type Image = {
	loading: boolean;
	uri: string | null;
};

type ThumbnailProps = {
	url: string;
	encrypted?: boolean;
};

const Thumbnail = ({ url, encrypted = false }: ThumbnailProps) => {
	const icon = encrypted ? 'encrypted' : 'play-filled';

	const [image, setImage] = useState<Image>({
		loading: true,
		uri: null
	});

	const generateThumbnail = async () => {
		try {
			if (!url) return;

			const { uri } = await getThumbnailAsync(url, {
				time: 1
			});
			setImage({
				loading: false,
				uri
			});
		} catch (e) {
			console.warn(e);
		}
	};

	useEffect(() => {
		generateThumbnail();
	}, [url]);

	return (
		<View style={styles.container}>
			{image.loading || !image.uri ? (
				<OverlayComponent style={styles.overlay} loading={image.loading} iconName='arrow-down-circle' />
			) : (
				<>
					<FastImage style={styles.image} source={{ uri: image.uri }} />
					<CustomIcon name={icon} size={54} color='#fff' style={styles.playerIcon} />
				</>
			)}
		</View>
	);
};

export default Thumbnail;
