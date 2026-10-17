import { type ReactElement, useEffect, useState } from 'react';
import { type StyleProp, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { FadeIn, LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '~/theme';
import { getRaisedHandColors } from './getRaisedHandColors';

interface IRaisedHandChip {
	label: string;
	isSelf: boolean;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	testID?: string;
}

export const REVEAL_DELAY_MS = 600;
const REVEAL_DURATION_MS = 250;
const LABEL_GAP = 4;

const styles = StyleSheet.create({
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		overflow: 'hidden'
	},
	label: {
		flexShrink: 1,
		marginLeft: LABEL_GAP
	}
});

const RaisedHandChip = ({ label, isSelf, style, textStyle, testID }: IRaisedHandChip): ReactElement => {
	const { colors } = useTheme();
	const { background, text } = getRaisedHandColors(colors, isSelf);
	const reducedMotion = useReducedMotion();
	const [revealed, setRevealed] = useState(reducedMotion);

	useEffect(() => {
		if (revealed) {
			return;
		}
		const timer = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
		return () => clearTimeout(timer);
	}, [revealed]);

	return (
		<Animated.View
			layout={LinearTransition.duration(REVEAL_DURATION_MS)}
			style={[styles.chip, { backgroundColor: background }, style]}
			testID={testID}>
			<Text style={textStyle}>✋</Text>
			{revealed ? (
				<Animated.Text
					entering={FadeIn.duration(REVEAL_DURATION_MS)}
					numberOfLines={1}
					style={[textStyle, styles.label, { color: text }]}>
					{label}
				</Animated.Text>
			) : null}
		</Animated.View>
	);
};

export default RaisedHandChip;
