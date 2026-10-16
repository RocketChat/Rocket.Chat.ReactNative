import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { Context } from './Context';
import { useTheme } from '~/theme';
import { type IPreview } from './interfaces';

const styles = StyleSheet.create({
	card: {
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 4,
		overflow: 'hidden'
	},
	cover: {
		width: '100%',
		height: 160
	},
	content: {
		padding: 12,
		gap: 8
	}
});

export const Preview = ({ title, description, thumb, preview, footer, parser }: IPreview) => {
	const { theme, colors } = useTheme();
	const imageUrl = thumb?.url ?? preview?.url;
	if (!imageUrl && !title?.length && !description?.length && !footer?.elements?.length) {
		return null;
	}

	return (
		<View style={[styles.card, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
			{imageUrl ? <ExpoImage style={styles.cover} source={{ uri: imageUrl }} contentFit='cover' /> : null}
			<View style={styles.content}>
				{title?.map((item, index) => (
					<View key={`title-${index}`}>{parser.text(item)}</View>
				))}
				{description?.map((item, index) => (
					<View key={`description-${index}`}>{parser.text(item)}</View>
				))}
				{footer?.elements ? <Context type='context' elements={footer.elements} parser={parser} theme={theme} /> : null}
			</View>
		</View>
	);
};
