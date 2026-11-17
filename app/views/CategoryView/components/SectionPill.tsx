import { Pressable, StyleSheet, Text } from 'react-native';

import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import { type ISectionPill } from './types';

const SectionPill = ({ header, title, selected, onSelect }: ISectionPill) => {
	const { colors } = useTheme();
	const backgroundColor = selected ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundSecondaryDefault;
	const pressedBackgroundColor = selected ? colors.buttonBackgroundPrimaryPress : colors.buttonBackgroundSecondaryPress;

	return (
		<Pressable
			onPress={() => onSelect(header, title)}
			style={({ pressed }) => [styles.pill, { backgroundColor: pressed ? pressedBackgroundColor : backgroundColor }]}
			android_ripple={{ color: pressedBackgroundColor }}
			accessibilityRole='tab'
			accessibilityState={{ selected }}
			accessibilityLabel={title}
			testID={`category-view-section-${header}`}>
			<Text style={[styles.title, { color: selected ? colors.fontWhite : colors.fontTitlesLabels }]} numberOfLines={1}>
				{title}
			</Text>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	pill: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		justifyContent: 'center',
		borderRadius: 16,
		overflow: 'hidden'
	},
	title: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textMedium
	}
});

export default SectionPill;
