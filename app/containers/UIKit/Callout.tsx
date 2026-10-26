import { StyleSheet, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { useTheme } from '~/theme';
import { type ICallout, type TCalloutVariant } from './interfaces';

const styles = StyleSheet.create({
	callout: {
		borderRadius: 4,
		borderLeftWidth: 4,
		padding: 12,
		gap: 8
	},
	title: {
		marginBottom: 4
	}
});

export const Callout = ({ title, text, variant = 'info', accessory, appId, blockId, parser }: ICallout) => {
	const { colors } = useTheme();
	const palette: Record<TCalloutVariant, { background: string; border: string }> = {
		info: { background: colors.statusBackgroundInfo, border: colors.statusFontInfo },
		danger: { background: colors.statusBackgroundDanger, border: colors.statusFontDanger },
		warning: { background: colors.statusBackgroundWarning, border: colors.statusFontWarning },
		success: { background: colors.statusBackgroundSuccess, border: colors.statusFontSuccess }
	};
	const { background, border } = palette[variant] ?? palette.info;

	return (
		<View style={[styles.callout, { backgroundColor: background, borderLeftColor: border }]}>
			{title ? <View style={styles.title}>{parser.text(title)}</View> : null}
			<View>{parser.text(text)}</View>
			{accessory ? <View>{parser.renderActions({ blockId, appId, ...accessory }, BlockContext.ACTION)}</View> : null}
		</View>
	);
};
