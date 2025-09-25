import React, { ReactElement, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Image } from 'expo-image';
import { dequal } from 'dequal';
import axios from 'axios';

import { useAppSelector } from '../../lib/hooks/useAppSelector';
import Touchable from './Touchable';
import openLink from '../../lib/methods/helpers/openLink';
import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import { LISTENER } from '../Toast';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import MessageContext from './Context';
import { IUrl } from '../../definitions';
import { WidthAwareContext } from './Components/WidthAwareView';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		gap: 4
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		padding: 12,
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	title: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	description: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	loading: {
		flex: 1,
		height: 150
	}
});

const UrlContent = ({ title, description }: { title: string; description: string }) => {
	const { colors } = useTheme();
	return (
		<View style={styles.textContainer}>
			{title ? (
				<Text style={[styles.title, { color: colors.fontInfo }]} numberOfLines={2}>
					{title}
				</Text>
			) : null}
			{description ? (
				<Text style={[styles.description, { color: colors.fontSecondaryInfo }]} numberOfLines={2}>
					{description}
				</Text>
			) : null}
		</View>
	);
};
const UrlImage = ({ image, hasContent }: { image: string; hasContent: boolean }) => {
	const { colors } = useTheme();
	const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
	const maxSize = useContext(WidthAwareContext);

	useLayoutEffect(() => {
		if (image && maxSize) {
			Image.loadAsync(image, {
				onError: () => {
					setImageDimensions({ width: -1, height: -1 });
				},
				maxWidth: maxSize
			}).then(image => {
				setImageDimensions({ width: image.width, height: image.height });
			});
		}
	}, [image, maxSize]);

	if (!imageDimensions.width || !imageDimensions.height) {
		return <View style={styles.loading} />;
	}
	if (imageDimensions.width === -1) {
		return null;
	}

	const width = Math.min(imageDimensions.width, maxSize) || 0;
	const height = Math.min((imageDimensions.height * ((width * 100) / imageDimensions.width)) / 100, maxSize) || 0;
	const imageStyle = {
		width,
		height
	};
	let containerStyle: ViewStyle = {
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		...(imageDimensions.width <= 64 && { width: 64 }),
		...(imageDimensions.height <= 64 && { height: 64 })
	};
	if (!hasContent) {
		containerStyle = {
			...containerStyle,
			borderColor: colors.strokeLight,
			borderWidth: 1,
			borderRadius: 4
		};
	}

	return (
		<View style={containerStyle}>
			<Image source={{ uri: image }} style={imageStyle} contentFit='contain' />
		</View>
	);
};

const Url = ({ url }: { url: IUrl }) => {
	const { colors, theme } = useTheme();
	const { baseUrl, user } = useContext(MessageContext);
	const API_Embed = useAppSelector(state => state.settings.API_Embed);
	const [imageUrl, setImageUrl] = useState(url.image);

	useEffect(() => {
		const verifyUrlIsImage = async () => {
			try {
				const imageUrl = getImageUrl();
				if (!imageUrl || !API_Embed) return;

				const response = await axios.head(imageUrl);
				const contentType = response.headers['content-type'];
				if (contentType?.startsWith?.('image/')) {
					setImageUrl(imageUrl);
				}
			} catch {
				// do nothing
			}
		};
		verifyUrlIsImage();
	}, [url.image, url.url, API_Embed]);

	const getImageUrl = () => {
		const _imageUrl = url.image || url.url;

		if (!_imageUrl) return null;
		if (_imageUrl.includes('http')) return _imageUrl;
		return `${baseUrl}/${_imageUrl}?rc_uid=${user.id}&rc_token=${user.token}`;
	};

	const onPress = () => openLink(url.url, theme);

	const onLongPress = () => {
		Clipboard.setString(url.url);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	const hasContent = !!(url.title || url.description);

	if (!url || url?.ignoreParse || !API_Embed) {
		return null;
	}

	return (
		<Touchable
			onPress={onPress}
			onLongPress={onLongPress}
			style={[
				styles.container,
				hasContent && {
					backgroundColor: colors.surfaceTint,
					borderColor: colors.strokeLight,
					borderRadius: 4,
					borderWidth: 1,
					overflow: 'hidden'
				}
			]}
			background={Touchable.Ripple(colors.surfaceNeutral)}>
			<>
				{imageUrl ? <UrlImage image={imageUrl} hasContent={hasContent} /> : null}
				{hasContent ? <UrlContent title={url.title} description={url.description} /> : null}
			</>
		</Touchable>
	);
};
const Urls = React.memo(
	({ urls }: { urls?: IUrl[] }): ReactElement[] | null => {
		if (!urls || urls.length === 0) {
			return null;
		}

		return urls.map((url: IUrl) => <Url url={url} key={url.url} />);
	},
	(oldProps, newProps) => dequal(oldProps.urls, newProps.urls)
);

UrlContent.displayName = 'MessageUrlContent';
UrlImage.displayName = 'MessageUrlImage';
Url.displayName = 'MessageUrl';
Urls.displayName = 'MessageUrls';

export default Urls;
