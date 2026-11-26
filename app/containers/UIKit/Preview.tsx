import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { useLinkPressHandlers } from '~/lib/hooks/useLinkPressHandlers';
import { MarkdownPreview } from '../markdown';
import { UrlImage } from '../message/components/Urls';
import { Context } from './Context';
import { Thumb } from './Image';
import { type IPreview, type IText } from './interfaces';

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

export const Preview = ({ title, description, preview, thumb, externalUrl, footer, parser }: IPreview) => {
	const { colors } = useTheme();
	const { onPress, onLongPress } = useLinkPressHandlers(externalUrl);

	return (
		<Pressable
			disabled={!externalUrl}
			onPress={onPress}
			onLongPress={onLongPress}
			accessibilityRole={externalUrl ? 'link' : undefined}
			style={[styles.card, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeLight }]}>
			{preview?.url ? <UrlImage key={preview.url} image={preview.url} hasContent knownDimensions={preview.dimensions} /> : null}
			<View style={styles.body}>
				<View style={styles.content}>
					{(title ?? []).map((text, index) => (
						<PreviewTitle key={`title-${index}`} text={text} />
					))}
					{(description ?? []).map((text, index) => (
						<Fragment key={`description-${index}`}>{parser.text(text)}</Fragment>
					))}
					{footer ? <Context {...footer} parser={parser} /> : null}
				</View>
				{thumb?.url ? <Thumb element={{ type: 'image', imageUrl: thumb.url }} /> : null}
			</View>
		</Pressable>
	);
};
