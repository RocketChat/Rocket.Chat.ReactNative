import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import FastImage from '@rocket.chat/react-native-fast-image';
import { dequal } from 'dequal';

import Touchable from './Touchable';
import openLink from '../../utils/openLink';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { useTheme, withTheme } from '../../theme';
import { LISTENER } from '../Toast';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';
import MessageContext from './Context';
import { IUrl } from '../../definitions';

const styles = StyleSheet.create({
	button: {
		marginTop: 6
	},
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
	marginTop: {
		marginTop: 4
	},
	image: {
		width: '100%',
		height: 150,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4
	}
});

const UrlImage = React.memo(
	({ image }: { image: string }) => {
		const { baseUrl, user } = useContext(MessageContext);

		if (!image) {
			return null;
		}

		image = image.includes('http') ? image : `${baseUrl}/${image}?rc_uid=${user.id}&rc_token=${user.token}`;
		return <FastImage source={{ uri: image }} style={styles.image} resizeMode={FastImage.resizeMode.cover} />;
	},
	(prevProps, nextProps) => prevProps.image === nextProps.image
);

const UrlContent = React.memo(
	({ title, description, theme }: { title: string; description: string; theme: string }) => (
		<View style={styles.textContainer}>
			{title ? (
				<Text style={[styles.title, { color: themes[theme].tintColor }]} numberOfLines={2}>
					{title}
				</Text>
			) : null}
			{description ? (
				<Text style={[styles.description, { color: themes[theme].auxiliaryText }]} numberOfLines={2}>
					{description}
				</Text>
			) : null}
		</View>
	),
	(prevProps, nextProps) => {
		if (prevProps.title !== nextProps.title) {
			return false;
		}
		if (prevProps.description !== nextProps.description) {
			return false;
		}
		if (prevProps.theme !== nextProps.theme) {
			return false;
		}
		return true;
	}
);

const Url = React.memo(
	({ url, index, theme }: { url: IUrl; index: number; theme: string }) => {
		if (!url || url?.ignoreParse) {
			return null;
		}

		const onPress = () => openLink(url.url, theme);

		const onLongPress = () => {
			Clipboard.setString(url.url);
			EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
		};

		return (
			<Touchable
				onPress={onPress}
				onLongPress={onLongPress}
				style={[
					styles.button,
					index > 0 && styles.marginTop,
					styles.container,
					{
						backgroundColor: themes[theme].chatComponentBackground,
						borderColor: themes[theme].borderColor
					}
				]}
				background={Touchable.Ripple(themes[theme].bannerBackground)}>
				<>
					<UrlImage image={url.image} />
					<UrlContent title={url.title} description={url.description} theme={theme} />
				</>
			</Touchable>
		);
	},
	(oldProps, newProps) => dequal(oldProps.url, newProps.url) && oldProps.theme === newProps.theme
);

const Urls = React.memo(
	// TODO - didn't work - (React.ReactElement | null)[] | React.ReactElement | null
	({ urls }: { urls?: IUrl[] }): any => {
		const { theme } = useTheme();

		if (!urls || urls.length === 0) {
			return null;
		}

		return urls.map((url: IUrl, index: number) => <Url url={url} key={url.url} index={index} theme={theme} />);
	},
	(oldProps, newProps) => dequal(oldProps.urls, newProps.urls)
);

UrlImage.displayName = 'MessageUrlImage';
UrlContent.displayName = 'MessageUrlContent';
Url.displayName = 'MessageUrl';
Urls.displayName = 'MessageUrls';

export default withTheme(Urls);
