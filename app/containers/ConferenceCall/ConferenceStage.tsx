import { type ReactElement, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { arrangeGridTiles } from '~/lib/methods/helpers/arrangeGridTiles';
import { TILE_GAP_PX } from '~/lib/methods/helpers/pickTileGridLayout';
import { gridColumnStartFor, OVERFLOW_CELL_KEY, type PriorityTile } from '~/lib/methods/helpers/splitByPriority';
import type { StageSize } from '~/lib/methods/helpers/spotlightOrientation';

export interface IStageTile extends PriorityTile {
	id: string;
}

interface IConferenceStage<T extends IStageTile> {
	tiles: T[];
	activeSpeakerId: string | null;
	selfId: string;
	renderTile: (tile: T) => ReactElement;
	renderOverflow: (hidden: T[]) => ReactElement;
}

type TCell = { key: string; node: ReactElement };

const STAGE_PADDING = 8;

const styles = StyleSheet.create({
	stage: {
		flex: 1,
		paddingHorizontal: STAGE_PADDING,
		alignItems: 'center',
		justifyContent: 'center'
	},
	grid: {
		gap: TILE_GAP_PX
	},
	row: {
		flexDirection: 'row',
		gap: TILE_GAP_PX
	}
});

const chunk = <T,>(items: T[], size: number): T[][] =>
	Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

const ConferenceStage = <T extends IStageTile>({
	tiles,
	activeSpeakerId,
	selfId,
	renderTile,
	renderOverflow
}: IConferenceStage<T>): ReactElement => {
	const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

	const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
		const width = layout.width - STAGE_PADDING * 2;
		setSize(current =>
			current.width === width && current.height === layout.height ? current : { width, height: layout.height }
		);
	};

	if (size.width <= 0 || size.height <= 0 || tiles.length === 0) {
		return <View style={styles.stage} onLayout={onLayout} testID='conference-stage' />;
	}

	const { visible, hidden, cellCount, layout } = arrangeGridTiles(tiles, size, { activeSpeakerId, selfId });
	const { cols, cellWidth, cellHeight } = layout;

	const cells: TCell[] = [
		...visible.map(tile => ({ key: tile.id, node: renderTile(tile) })),
		...(hidden.length > 0 ? [{ key: OVERFLOW_CELL_KEY, node: renderOverflow(hidden) }] : [])
	];

	return (
		<View style={styles.stage} onLayout={onLayout} testID='conference-stage'>
			<View style={styles.grid}>
				{chunk(cells, cols).map((row, rowIndex) => {
					const firstIndex = rowIndex * cols;
					const columnStart = gridColumnStartFor(firstIndex, cellCount, cols);
					const offset = columnStart ? (columnStart - 1) * (cellWidth + TILE_GAP_PX) : 0;
					return (
						<View key={row[0].key} style={[styles.row, { paddingLeft: offset }]}>
							{row.map(cell => (
								<View key={cell.key} style={{ width: cellWidth, height: cellHeight }}>
									{cell.node}
								</View>
							))}
						</View>
					);
				})}
			</View>
		</View>
	);
};

export default ConferenceStage;
