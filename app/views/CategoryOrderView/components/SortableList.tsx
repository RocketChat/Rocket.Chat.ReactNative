import { useEffect } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { type ICategoryOrderGroup } from '../hooks/useCategoryOrder';
import { useNativeListRowHeight } from '~/containers/NativeListRow/hooks/useNativeListRowHeight';
import { swapWithNeighbour, toPositions } from '../sortablePositions';
import CategoryOrderRow from './CategoryOrderRow';
import SortableRow from './SortableRow';

interface ISortableList {
	groups: ICategoryOrderGroup[];
	onReorder: (ids: string[]) => void;
	onDraggingChange: (isDragging: boolean) => void;
}

const SortableList = ({ groups, onReorder, onDraggingChange }: ISortableList) => {
	const rowHeight = useNativeListRowHeight();
	const ids = groups.map(group => group.id);
	const positions = useSharedValue(toPositions(ids));
	const activeId = useSharedValue<string | null>(null);
	const order = JSON.stringify(ids);

	useEffect(() => {
		if (activeId.get() === null) {
			positions.set(toPositions(JSON.parse(order)));
		}
	}, [order, positions, activeId]);

	const onPickUp = () => onDraggingChange(true);

	const onDrop = (droppedIds: string[]) => {
		onDraggingChange(false);
		if (droppedIds.join() !== ids.join()) {
			onReorder(droppedIds);
		}
	};

	const onMoveBy = (index: number, offset: -1 | 1) => {
		const movedIds = swapWithNeighbour(ids, index, offset);
		if (movedIds) {
			onReorder(movedIds);
		}
	};

	return (
		<View style={{ height: groups.length * rowHeight }}>
			{groups.map((group, index) => (
				<SortableRow
					key={group.id}
					id={group.id}
					index={index}
					title={group.title}
					rowCount={groups.length}
					rowHeight={rowHeight}
					positions={positions}
					activeId={activeId}
					onPickUp={onPickUp}
					onDrop={onDrop}
					onMoveBy={onMoveBy}>
					{dragGesture => <CategoryOrderRow title={group.title} dragGesture={dragGesture} showSeparator />}
				</SortableRow>
			))}
		</View>
	);
};

export default SortableList;
