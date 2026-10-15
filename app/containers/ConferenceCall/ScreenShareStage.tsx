import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { TILE_GAP_PX } from '~/lib/methods/helpers/pickTileGridLayout';
import { spotlightOrientation } from '~/lib/methods/helpers/spotlightOrientation';
import type { IStageTile } from './ConferenceStage';
import ScreenShareThumb from './ScreenShareThumb';
import ScreenViewer from './ScreenViewer';
import ThumbList, { type TThumb } from './ThumbList';
import { useStageSize } from './useStageSize';

export type TScreenShareView = { key: string; video: ReactElement; label: string };

interface IScreenShareStage<T extends IStageTile> {
	featured: TScreenShareView & { onStop?: () => void };
	others: (TScreenShareView & { onSpotlight: () => void })[];
	tiles: T[];
	renderTile: (tile: T) => ReactElement;
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
	}
});

const ScreenShareStage = <T extends IStageTile>({ featured, others, tiles, renderTile }: IScreenShareStage<T>): ReactElement => {
	const [onLayout, size] = useStageSize();
	const orientation = spotlightOrientation(size);

	const thumbs: TThumb[] = [
		...others.map(share => ({
			key: `screen-${share.key}`,
			wide: true,
			node: (
				<ScreenShareThumb
					video={share.video}
					label={share.label}
					onSpotlight={share.onSpotlight}
					testID={`conference-screen-thumb-${share.key}`}
				/>
			)
		})),
		...tiles.map(tile => ({ key: tile.id, node: renderTile(tile) }))
	];

	return (
		<View
			style={[styles.stage, orientation === 'stacked' ? styles.stacked : styles.sideBySide]}
			onLayout={onLayout}
			testID='conference-screen-share'>
			<ScreenViewer video={featured.video} label={featured.label} onStop={featured.onStop} />
			<ThumbList thumbs={thumbs} orientation={orientation} scrollEnabled />
		</View>
	);
};

export default ScreenShareStage;
