import { useContext, useEffect, useState, type ReactElement } from 'react';
import { StyleSheet, Text, View, type ImageStyle, type ViewStyle } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Image, type ImageLoadEventData } from 'expo-image';
import axios from 'axios';

import MessageActionTouchable from './Touchable/MessageActionTouchable';
import openLink from '~/lib/methods/helpers/openLink';
import { formatAttachmentUrl } from '~/lib/methods/helpers/formatAttachmentUrl';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import { LISTENER } from '~/containers/Toast';
import EventEmitter from '~/lib/methods/helpers/events';
import I18n from '~/i18n';
import { type IUrl } from '~/definitions';
import { WidthAwareContext } from './WidthAwareView';
import { useUrls } from '../stores/MessageStore';
import { useBaseUrl, useMessageUser } from '../stores/MessageRoomStore';
import { useSetting } from '~/lib/hooks/useSetting';

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
	},
	loadingImage: {
		flex: 1
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

type ImageDimensions = { width: number; height: number };

const getImageStyles = (dimensions: ImageDimensions, maxSize: number) => {
	const aspectRatio = dimensions.width / dimensions.height;
	const isWidthMeasured = maxSize > 0;
	const imageStyle: ImageStyle = {
		width: '100%',
		maxWidth: dimensions.width,
		aspectRatio: isWidthMeasured ? aspectRatio : Math.max(aspectRatio, 1),
		...(isWidthMeasured && { maxHeight: maxSize })
	};
	const containerStyle: ViewStyle = {
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		...(dimensions.width <= 64 && { width: 64 }),
		...(dimensions.height <= 64 && { height: 64 })
	};
	return { imageStyle, containerStyle };
};

const UrlImage = ({
	image,
	hasContent,
	knownDimensions
}: {
	image: string;
	hasContent: boolean;
	knownDimensions?: ImageDimensions;
}) => {
	const { colors } = useTheme();
	const maxSize = useContext(WidthAwareContext);
	const [loadedDimensions, setLoadedDimensions] = useState<ImageDimensions | null>(null);
	const [failed, setFailed] = useState(false);
	const dimensions = knownDimensions ?? loadedDimensions;

	if (failed) {
		return null;
	}

	const onLoad = ({ source }: ImageLoadEventData) => setLoadedDimensions({ width: source.width, height: source.height });
	const onError = () => setFailed(true);

	if (!dimensions) {
		return (
			<View style={styles.loading}>
				<Image source={{ uri: image }} style={styles.loadingImage} contentFit='contain' onLoad={onLoad} onError={onError} />
			</View>
		);
	}

	const { imageStyle, containerStyle } = getImageStyles(dimensions, maxSize);
	const borderStyle: ViewStyle | undefined = hasContent
		? undefined
		: { borderColor: colors.strokeLight, borderWidth: 1, borderRadius: 4 };

	return (
		<View style={[containerStyle, borderStyle]}>
			<Image source={{ uri: image }} style={imageStyle} contentFit='contain' onError={onError} />
		</View>
	);
};

const useImageUrl = (url: IUrl): string | null => {
	const baseUrl = useBaseUrl();
	const user = useMessageUser();
	const API_Embed = useSetting('API_Embed') as boolean;
	const [verifiedImageUrl, setVerifiedImageUrl] = useState<string | null>(null);

	useEffect(() => {
		if (url.image || !url.url || !API_Embed) return;
		const linkUrl = formatAttachmentUrl(url.url, user?.id ?? '', user?.token ?? '', baseUrl ?? '');
		axios
			.head(linkUrl)
			.then(response => {
				if (response.headers['content-type']?.startsWith?.('image/')) {
					setVerifiedImageUrl(linkUrl);
				}
			})
			.catch(() => {});
	}, [url.image, url.url, API_Embed, baseUrl, user?.id, user?.token]);

	return url.image ? formatAttachmentUrl(url.image, user?.id ?? '', user?.token ?? '', baseUrl ?? '') : verifiedImageUrl;
};

const Url = ({ url }: { url: IUrl }) => {
	const { colors, theme } = useTheme();
	const API_Embed = useSetting('API_Embed') as boolean;
	const imageUrl = useImageUrl(url);
	const knownDimensions = url.imageWidth && url.imageHeight ? { width: url.imageWidth, height: url.imageHeight } : undefined;

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
		<MessageActionTouchable
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
			]}>
			<>
				{imageUrl ? <UrlImage key={imageUrl} image={imageUrl} hasContent={hasContent} knownDimensions={knownDimensions} /> : null}
				{hasContent ? <UrlContent title={url.title} description={url.description} /> : null}
			</>
		</MessageActionTouchable>
	);
};
const Urls = (): ReactElement[] | null => {
	const urls = useUrls();

	if (!urls || urls.length === 0) {
		return null;
	}

	return urls.map((url: IUrl) => <Url url={url} key={url.url} />);
};

export default Urls;
