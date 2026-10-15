import { type ReactElement, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { ActiveReaction } from '~/lib/services/conference/callDataProtocol';
import { REACTION_TTL_MS } from '~/lib/services/conference/callDataProtocol';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IReactionLayer {
	reactions: ActiveReaction[];
	nameFor: (participantId: string) => string;
}

const LANES = 5;
const LANE_WIDTH = 56;

const styles = StyleSheet.create({
	layer: {
		position: 'absolute',
		left: 16,
		bottom: 16,
		width: LANES * LANE_WIDTH,
		height: 240
	},
	bubble: {
		position: 'absolute',
		bottom: 0,
		alignItems: 'center'
	},
	emoji: {
		fontSize: 32,
		textShadowColor: 'rgba(0, 0, 0, 0.4)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 6
	},
	plate: {
		maxWidth: LANE_WIDTH * 2,
		marginTop: 2,
		paddingHorizontal: 8,
		borderRadius: 12
	},
	name: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	}
});

const laneOf = (id: string): number => {
	let hash = 0;
	for (let index = 0; index < id.length; index += 1) {
		hash = (hash * 31 + id.charCodeAt(index)) % LANES;
	}
	return hash;
};

const ReactionBubble = ({ reaction, name }: { reaction: ActiveReaction; name: string }): ReactElement => {
	const { colors } = useTheme();
	const progress = useSharedValue(0);

	useEffect(() => {
		progress.set(withTiming(1, { duration: REACTION_TTL_MS, easing: Easing.out(Easing.quad) }));
	}, [progress]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0, 0.12, 0.75, 1], [0, 1, 1, 0]),
		transform: [
			{ translateY: interpolate(progress.value, [0, 0.12, 0.75, 1], [24, 0, -120, -180]) },
			{ scale: interpolate(progress.value, [0, 0.12, 0.75, 1], [0.6, 1, 1, 0.9]) }
		]
	}));

	return (
		<Animated.View style={[styles.bubble, { left: laneOf(reaction.id) * LANE_WIDTH }, animatedStyle]}>
			<Text style={styles.emoji}>{reaction.emoji}</Text>
			<View style={[styles.plate, { backgroundColor: colors.overlayBackground }]}>
				<Text style={[styles.name, { color: colors.fontPureWhite }]} numberOfLines={1}>
					{name}
				</Text>
			</View>
		</Animated.View>
	);
};

const ReactionLayer = ({ reactions, nameFor }: IReactionLayer): ReactElement => (
	<View style={styles.layer} pointerEvents='none' testID='conference-reaction-layer'>
		{reactions.map(reaction => (
			<ReactionBubble key={reaction.id} reaction={reaction} name={nameFor(reaction.participantId)} />
		))}
	</View>
);

export default ReactionLayer;
