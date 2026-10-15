import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { TILE_GAP_PX } from '~/lib/methods/helpers/pickTileGridLayout';
import { OVERFLOW_CELL_KEY, splitByPriority } from '~/lib/methods/helpers/splitByPriority';
import { sidebarCapacity, spotlightOrientation } from '~/lib/methods/helpers/spotlightOrientation';
import { useTheme } from '~/theme';
import type { IStageTile } from './ConferenceStage';
import ThumbList, { type TThumb } from './ThumbList';
import { useStageSize } from './useStageSize';

interface ISidebarStage<T extends IStageTile> {
	featured: T;
	tiles: T[];
	activeSpeakerId: string | null;
	selfId: string;
	renderTile: (tile: T) => ReactElement;
	renderOverflow: (hidden: T[]) => ReactElement;
}

const styles = StyleSheet.create({
	stage: {
		flex: 1,
		paddingHorizontal: 8,
		gap: TILE_GAP_PX
	},
	stacked: {
		flexDirection: 'column'
	},
	sideBySide: {
		flexDirection: 'row'
	},
	main: {
		flex: 1,
		borderRadius: 8,
		overflow: 'hidden'
	}
});

const SidebarStage = <T extends IStageTile>({
	featured,
	tiles,
	activeSpeakerId,
	selfId,
	renderTile,
	renderOverflow
}: ISidebarStage<T>): ReactElement => {
	const { colors } = useTheme();
	const [onLayout, size] = useStageSize();
	const orientation = spotlightOrientation(size);

	const { visible, hidden } = splitByPriority(
		tiles.filter(({ id }) => id !== featured.id),
		sidebarCapacity(size, orientation),
		{ activeSpeakerId, selfId }
	);

	const thumbs: TThumb[] = [
		...visible.map(tile => ({ key: tile.id, node: renderTile(tile) })),
		...(hidden.length > 0 ? [{ key: OVERFLOW_CELL_KEY, node: renderOverflow(hidden) }] : [])
	];

	return (
		<View
			style={[styles.stage, orientation === 'stacked' ? styles.stacked : styles.sideBySide]}
			onLayout={onLayout}
			testID='conference-sidebar'>
			<View style={[styles.main, { backgroundColor: colors.surfaceNeutral }]}>{renderTile(featured)}</View>
			{thumbs.length > 0 ? <ThumbList thumbs={thumbs} orientation={orientation} scrollEnabled={false} /> : null}
		</View>
	);
};

export default SidebarStage;
