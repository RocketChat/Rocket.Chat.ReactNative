import React from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { IAttachment, IUserMessage } from '../../../../../definitions';
import { TGetCustomEmoji } from '../../../../../definitions/IEmoji';
import { isValidUrl } from '../../../../../lib/methods/helpers/isValidUrl';
import { useTheme } from '../../../../../theme';
import styles from '../../../styles';
import BlurComponent from '../../OverlayComponent';

interface IMessageImage {
	uri: string;
	cached: boolean;
	loading: boolean;
	encrypted: boolean;
}

export const MessageImage = React.memo(({ uri, cached, loading, encrypted = false }: IMessageImage) => {
	const { colors } = useTheme();
	const valid = isValidUrl(uri);

	if (encrypted && !loading && cached) {
		return (
			<>
				<View style={styles.image} />
				<BlurComponent loading={false} style={[styles.image, styles.imageBlurContainer]} iconName='encrypted' />
			</>
		);
	}

	return (
		<>
			{valid ? (
				<FastImage
					style={[styles.image, { borderColor: colors.strokeLight }]}
					source={{ uri: encodeURI(uri) }}
					resizeMode={FastImage.resizeMode.cover}
				/>
			) : (
				<View style={styles.image} />
			)}
			{!cached ? (
				<BlurComponent loading={loading} style={[styles.image, styles.imageBlurContainer]} iconName='arrow-down-circle' />
			) : null}
		</>
	);
});

MessageImage.displayName = 'MessageImage';
