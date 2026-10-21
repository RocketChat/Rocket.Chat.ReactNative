import * as Haptics from 'expo-haptics';
import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useTheme } from '~/theme';

export const CONFERENCE_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉', '👏', '🤔', '🙏'] as const;

interface IReactionPicker {
	onPick: (emoji: string) => void;
}

const BUTTON_SIZE = 56;

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		paddingHorizontal: 16,
		paddingTop: 8,
		gap: 8
	},
	button: {
		width: BUTTON_SIZE,
		height: BUTTON_SIZE,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center'
	},
	emoji: {
		fontSize: 28
	}
});

const ReactionPicker = ({ onPick }: IReactionPicker): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={styles.row} testID='conference-reaction-picker'>
			{CONFERENCE_REACTIONS.map(emoji => (
				<Pressable
					key={emoji}
					accessibilityRole='button'
					accessibilityLabel={I18n.t('Send_reaction_emoji', { emoji })}
					testID={`conference-reaction-${emoji}`}
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: pressed ? colors.buttonBackgroundSecondaryPress : colors.buttonBackgroundSecondaryDefault }
					]}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onPick(emoji);
					}}>
					<Text style={styles.emoji}>{emoji}</Text>
				</Pressable>
			))}
		</View>
	);
};

export default ReactionPicker;
