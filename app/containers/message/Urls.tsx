import React, { useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import FastImage from 'react-native-fast-image';
import { dequal } from 'dequal';

import Touchable from './Touchable';
import openLink from '../../lib/methods/helpers/openLink';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes, useTheme, withTheme } from '../../theme';
import { LISTENER } from '../Toast';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import MessageContext from './Context';
import { IUrl } from '../../definitions';
import { WidthAwareContext, WidthAwareView } from './Components/WidthAwareView';

const styles = StyleSheet.create({
	button: {
		marginTop: 6
	},
	container: {
		flex: 1,
		flexDirection: 'column'
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		padding: 15,
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
	marginTop: {
		marginTop: 4
	},
	loading: {
		height: 0,
		borderWidth: 0,
		marginTop: 0
	}
});

const UrlContent = React.memo(
	({ title, description }: { title: string; description: string }) => {
		const { colors } = useTheme();
		return (
			<View style={styles.textContainer}>
				{title ? (
					<Text style={[styles.title, { color: colors.badgeBackgroundLevel2 }]} numberOfLines={2}>
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
	},
	(prevProps, nextProps) => {
		if (prevProps.title !== nextProps.title) {
			return false;
		}
		if (prevProps.description !== nextProps.description) {
			return false;
		}
		return true;
	}
);

const UrlImage = ({ image, hasContent }: { image: string; hasContent: boolean }) => {
	const { colors } = useTheme();
	const [imageLoadedState, setImageLoadedState] = useState<TImageLoadedState>('loading');
	const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
	const maxSize = useContext(WidthAwareContext);

	useEffect(() => {
		if (image) {
			Image.getSize(
				image,
				(width, height) => {
					setImageDimensions({ width, height });
				},
				() => {
					setImageLoadedState('error');
				}
			);
		}
	}, [image]);

	let imageStyle = {};
	let containerStyle: ViewStyle = {};

	if (imageLoadedState === 'done') {
		const width = Math.min(imageDimensions.width, maxSize) || 0;
		const height = Math.min((imageDimensions.height * ((width * 100) / imageDimensions.width)) / 100, maxSize) || 0;
		imageStyle = {
			width,
			height
		};
		containerStyle = {
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
	}

	return (
		<View style={containerStyle}>
			<FastImage
				source={{ uri: image }}
				style={[imageStyle, imageLoadedState === 'loading' && styles.loading]}
				resizeMode={FastImage.resizeMode.contain}
				onError={() => setImageLoadedState('error')}
				onLoad={() => setImageLoadedState('done')}
			/>
		</View>
	);
};

type TImageLoadedState = 'loading' | 'done' | 'error';

const Url = React.memo(
	({ url, index, theme }: { url: IUrl; index: number; theme: TSupportedThemes }) => {
		const { baseUrl, user } = useContext(MessageContext);
		let image = url.image || url.url;
		image = image.includes('http') ? image : `${baseUrl}/${image}?rc_uid=${user.id}&rc_token=${user.token}`;

		const onPress = () => openLink(url.url, theme);

		const onLongPress = () => {
			Clipboard.setString(url.url);
			EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
		};

		const hasContent = !!(url.title || url.description);

		if (!url || url?.ignoreParse) {
			return null;
		}

		return (
			<Touchable
				onPress={onPress}
				onLongPress={onLongPress}
				style={[
					styles.button,
					index > 0 && styles.marginTop,
					styles.container,
					hasContent && {
						backgroundColor: themes[theme].surfaceTint,
						borderColor: themes[theme].strokeLight,
						borderRadius: 4,
						borderWidth: 1,
						overflow: 'hidden'
					}
				]}
				background={Touchable.Ripple(themes[theme].surfaceNeutral)}>
				<>
					{image ? (
						<WidthAwareView>
							<UrlImage image={image} hasContent={hasContent} />
						</WidthAwareView>
					) : null}
					{hasContent ? <UrlContent title={url.title} description={url.description} /> : null}
				</>
			</Touchable>
		);
	},
	(oldProps, newProps) => dequal(oldProps.url, newProps.url) && oldProps.theme === newProps.theme
);

const Urls = React.memo(
	({ urls }: { urls?: IUrl[] }): any => {
		const { theme } = useTheme();

		if (!urls || urls.length === 0) {
			return null;
		}

		return urls.map((url: IUrl, index: number) => <Url url={url} key={url.url} index={index} theme={theme} />);
	},
	(oldProps, newProps) => dequal(oldProps.urls, newProps.urls)
);

UrlContent.displayName = 'MessageUrlContent';
Url.displayName = 'MessageUrl';
Urls.displayName = 'MessageUrls';

export default withTheme(Urls);
