import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { BlockContext } from '@rocket.chat/ui-kit';

import I18n from '~/i18n';
import { LISTENER } from '~/containers/Toast';
import EventEmitter from '~/lib/methods/helpers/events';
import openLink from '~/lib/methods/helpers/openLink';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { MarkdownPreview } from '../markdown';
import { UrlImage } from '../message/components/Urls';
import { Context } from './Context';
import { Thumb } from './Image';
import { type IParser, type IPreview, type IText } from './interfaces';

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 4,
		overflow: 'hidden'
	},
	body: {
		flexDirection: 'row',
		padding: 12,
		gap: 12
	},
	content: {
		flex: 1,
		gap: 4
	},
	title: {
		fontSize: 16,
		...sharedStyles.textMedium
	}
});

const PreviewTitle = ({ text }: { text: IText }) => {
	const { colors } = useTheme();
	const titleStyle = [styles.title, { color: colors.fontInfo }];
	if (text.type === 'mrkdwn') {
		return <MarkdownPreview msg={text.text} numberOfLines={2} style={titleStyle} />;
	}
	return (
		<Text style={titleStyle} numberOfLines={2}>
			{text.text}
		</Text>
	);
};

const renderDescription = (parser: IParser, text: IText) =>
	text.type === 'mrkdwn' ? parser.mrkdwn?.(text, BlockContext.NONE) : parser.plain_text?.(text, BlockContext.NONE);

export const Preview = ({ title, description, preview, thumb, externalUrl, footer, parser }: IPreview) => {
	const { colors, theme } = useTheme();

	const onPress = () => {
		if (externalUrl) {
			openLink(externalUrl, theme);
		}
	};

	const onLongPress = () => {
		if (!externalUrl) {
			return;
		}
		Clipboard.setString(externalUrl);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	return (
		<Pressable
			disabled={!externalUrl}
			onPress={onPress}
			onLongPress={onLongPress}
			style={[styles.card, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeLight }]}>
			{preview?.url ? <UrlImage image={preview.url} hasContent knownDimensions={preview.dimensions} /> : null}
			<View style={styles.body}>
				<View style={styles.content}>
					{title.map((text, index) => (
						<PreviewTitle key={`title-${index}`} text={text} />
					))}
					{description.map((text, index) => (
						<Fragment key={`description-${index}`}>{renderDescription(parser, text)}</Fragment>
					))}
					{footer ? <Context {...footer} parser={parser} /> : null}
				</View>
				{thumb?.url ? <Thumb element={{ type: 'image', imageUrl: thumb.url }} /> : null}
			</View>
		</Pressable>
	);
};
