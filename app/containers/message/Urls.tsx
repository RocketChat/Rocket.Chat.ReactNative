import React, { useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, unstable_batchedUpdates, View } from 'react-native';
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
import { DEFAULT_MESSAGE_HEIGHT } from './utils';
import { WidthAwareContext, WidthAwareView } from './Components/WidthAwareView';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		borderRadius: 4,
		borderWidth: 1
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
	imageWithoutContent: {
		borderRadius: 4
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

const UrlImage = ({
	image,
	hasContent,
	imageLoadedState,
	setImageLoadedState
}: {
	image: string;
	hasContent: boolean;
	imageLoadedState: TImageLoadedState;
	setImageLoadedState: Function;
}) => {
	const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
	const maxSize = useContext(WidthAwareContext);

	useEffect(() => {
		if (image) {
			Image.getSize(
				image,
				(width, height) => {
					unstable_batchedUpdates(() => {
						setImageDimensions({ width, height });
						setImageLoadedState('done');
					});
				},
				() => {
					setImageLoadedState('error');
				}
			);
		}
	}, [image]);

	if (!image || !imageDimensions.width) {
		return null;
	}

	const width = Math.min(imageDimensions.width, maxSize);
	const height = (imageDimensions.height * ((width * 100) / imageDimensions.width)) / 100;

	return (
		<FastImage
			source={{ uri: image }}
			style={[{ width, height }, !hasContent && styles.imageWithoutContent, imageLoadedState === 'loading' && styles.loading]}
			resizeMode={FastImage.resizeMode.contain}
			onError={() => setImageLoadedState('error')}
			onLoad={() => setImageLoadedState('done')}
		/>
	);
};

type TImageLoadedState = 'loading' | 'done' | 'error';

const Url = React.memo(
	({ url, index, theme }: { url: IUrl; index: number; theme: TSupportedThemes }) => {
		const [imageLoadedState, setImageLoadedState] = useState<TImageLoadedState>('loading');
		const { baseUrl, user } = useContext(MessageContext);
		let image = url.image || url.url;
		image = image.includes('http') ? image : `${baseUrl}/${image}?rc_uid=${user.id}&rc_token=${user.token}`;

		const onPress = () => openLink(url.url, theme);

		const onLongPress = () => {
			Clipboard.setString(url.url);
			EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
		};

		const hasContent = !!(url.title || url.description);

		if (!url || url?.ignoreParse || imageLoadedState === 'error') {
			return null;
		}

		return (
			<Touchable
				onPress={onPress}
				onLongPress={onLongPress}
				style={[
					styles.container,
					{
						backgroundColor: themes[theme].surfaceTint,
						borderColor: themes[theme].strokeLight
					},
					imageLoadedState === 'loading' && styles.loading
				]}
				background={Touchable.Ripple(themes[theme].surfaceNeutral)}>
				<>
					<WidthAwareView>
						<UrlImage
							image={image}
							hasContent={hasContent}
							imageLoadedState={imageLoadedState}
							setImageLoadedState={setImageLoadedState}
						/>
					</WidthAwareView>
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

		return (
			<View style={{ gap: 6 }}>
				{urls.map((url: IUrl, index: number) => (
					<Url url={url} key={url.url} index={index} theme={theme} />
				))}
			</View>
		);
	},
	(oldProps, newProps) => dequal(oldProps.urls, newProps.urls)
);

UrlContent.displayName = 'MessageUrlContent';
Url.displayName = 'MessageUrl';
Urls.displayName = 'MessageUrls';

export default withTheme(Urls);
