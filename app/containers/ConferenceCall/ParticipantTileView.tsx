import { type ReactElement, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import Avatar from '~/containers/Avatar';
import { CustomIcon } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import RaisedHandChip, { getRaisedHandColors } from './RaisedHandChip';

interface IParticipantTileView {
	identity: string;
	name: string;
	muted: boolean;
	video?: ReactElement | null;
	speaking?: boolean;
	isSelf?: boolean;
	handPosition?: number;
	badge?: string;
	testID?: string;
}

const BACKDROP_TINTS = ['#5f141480', '#1a3a5f80', '#145f2a80', '#5f4a1480', '#3a145f80'];
const HASH_MULTIPLIER = 31;
const TILE_RING_WIDTH = 4;
const OVERLAY_INSET = TILE_RING_WIDTH + 4;
const AVATAR_SIZE = 48;
const COMPACT_AVATAR_SIZE = 32;
const MIC_BADGE_SIZE = 28;
const COMPACT_MIC_BADGE_SIZE = 20;
const COMPACT_TILE_WIDTH = 200;

const styles = StyleSheet.create({
	tile: {
		flex: 1,
		borderRadius: 8,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center'
	},
	ring: {
		borderRadius: 8
	},
	micBadge: {
		position: 'absolute',
		top: OVERLAY_INSET,
		right: OVERLAY_INSET,
		width: MIC_BADGE_SIZE,
		height: MIC_BADGE_SIZE,
		borderRadius: MIC_BADGE_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center'
	},
	sendBadge: {
		position: 'absolute',
		top: OVERLAY_INSET,
		left: OVERLAY_INSET,
		paddingHorizontal: 4,
		paddingVertical: 2,
		borderRadius: 4
	},
	badgeText: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	},
	labelRow: {
		position: 'absolute',
		left: OVERLAY_INSET,
		right: OVERLAY_INSET,
		bottom: OVERLAY_INSET,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	handPill: {
		flexShrink: 1,
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 16
	},
	handBadge: {
		position: 'absolute',
		top: OVERLAY_INSET,
		left: OVERLAY_INSET,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10
	},
	handText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24
	},
	name: {
		...sharedStyles.textRegular,
		flexShrink: 1,
		fontSize: 16,
		lineHeight: 24,
		textShadowColor: 'rgba(0, 0, 0, 0.6)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2
	},
	nameCompact: {
		fontSize: 12,
		lineHeight: 16
	}
});

export const backdropTint = (name: string): string => {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash * HASH_MULTIPLIER + name.charCodeAt(i)) | 0;
	}
	return BACKDROP_TINTS[Math.abs(hash) % BACKDROP_TINTS.length];
};

const ParticipantTileView = ({
	identity,
	name,
	muted,
	video,
	speaking = false,
	isSelf = false,
	handPosition,
	badge,
	testID
}: IParticipantTileView): ReactElement => {
	const { colors } = useTheme();
	const [compact, setCompact] = useState(false);
	const label = muted ? `${name}, ${I18n.t('Microphone_muted')}` : name;
	const handColors = getRaisedHandColors(colors, isSelf);

	return (
		<View
			accessible
			accessibilityLabel={label}
			testID={testID}
			onLayout={event => setCompact(event.nativeEvent.layout.width < COMPACT_TILE_WIDTH)}
			style={[styles.tile, { backgroundColor: colors.surfaceNeutral }]}>
			{video ?? (
				<>
					<View style={[StyleSheet.absoluteFill, { backgroundColor: backdropTint(name) }]} />
					<Avatar
						avatar={`/avatar/uid/${identity}`}
						text={name}
						size={compact ? COMPACT_AVATAR_SIZE : AVATAR_SIZE}
						borderRadius={4}
					/>
				</>
			)}
			{speaking ? (
				<View
					testID='participant-tile-speaking'
					pointerEvents='none'
					style={[StyleSheet.absoluteFill, styles.ring, { borderWidth: TILE_RING_WIDTH, borderColor: colors.strokeHighlight }]}
				/>
			) : null}
			{badge && !compact ? (
				<View style={[styles.sendBadge, { backgroundColor: colors.overlayBackground }]}>
					<Text style={[styles.badgeText, { color: colors.fontPureWhite }]}>{badge}</Text>
				</View>
			) : null}
			{muted ? (
				<View
					style={[
						styles.micBadge,
						compact && {
							width: COMPACT_MIC_BADGE_SIZE,
							height: COMPACT_MIC_BADGE_SIZE,
							borderRadius: COMPACT_MIC_BADGE_SIZE / 2
						},
						{ backgroundColor: colors.overlayBackground }
					]}
					testID='participant-tile-muted'>
					<CustomIcon name='mic-off' size={compact ? 12 : 16} color={colors.fontPureWhite} />
				</View>
			) : null}
			{handPosition && compact ? (
				<View style={[styles.handBadge, { backgroundColor: handColors.background }]} testID='participant-tile-hand'>
					<Text style={[styles.handText, styles.nameCompact, { color: handColors.text }]} numberOfLines={1}>
						{`✋ ${handPosition}`}
					</Text>
				</View>
			) : null}
			<View style={styles.labelRow}>
				{handPosition && !compact ? (
					<RaisedHandChip
						label={`(${handPosition}) ${name}`}
						isSelf={isSelf}
						style={styles.handPill}
						textStyle={styles.handText}
						testID='participant-tile-hand'
					/>
				) : (
					<Text style={[styles.name, compact && styles.nameCompact, { color: colors.fontPureWhite }]} numberOfLines={1}>
						{name}
					</Text>
				)}
			</View>
		</View>
	);
};

export default ParticipantTileView;
