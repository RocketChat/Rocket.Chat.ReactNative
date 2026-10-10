import * as Haptics from 'expo-haptics';
import { type ReactElement } from 'react';
import { type AccessibilityActionEvent, StyleSheet } from 'react-native';
import { type PanGesture, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import i18n from '~/i18n';
import { moveIndex, orderedIds, type SortablePositions } from '../sortablePositions';

const DRAG_HANDLE_HIT_SLOP = { left: 12, right: 12, top: 13, bottom: 13 };

const styles = StyleSheet.create({
	row: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0
	}
});

const triggerPickUpHaptic = () => {
	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface ISortableRow {
	id: string;
	index: number;
	title: string;
	rowCount: number;
	rowHeight: number;
	positions: SharedValue<SortablePositions>;
	activeId: SharedValue<string | null>;
	onDrop: (ids: string[]) => void;
	onMoveBy: (index: number, offset: -1 | 1) => void;
	children: (dragGesture: PanGesture) => ReactElement;
}

const SortableRow = ({
	id,
	index,
	title,
	rowCount,
	rowHeight,
	positions,
	activeId,
	onDrop,
	onMoveBy,
	children
}: ISortableRow) => {
	const offset = useSharedValue(index * rowHeight);
	const dragStartOffset = useSharedValue(0);

	useAnimatedReaction(
		() => positions.value[id],
		(position, previousPosition) => {
			if (previousPosition !== null && position !== previousPosition && activeId.value !== id) {
				offset.set(withTiming(position * rowHeight));
			}
		}
	);

	const dragGesture = usePanGesture({
		hitSlop: DRAG_HANDLE_HIT_SLOP,
		onActivate: () => {
			activeId.set(id);
			dragStartOffset.set(offset.value);
			scheduleOnRN(triggerPickUpHaptic);
		},
		onUpdate: event => {
			const maxOffset = (rowCount - 1) * rowHeight;
			offset.set(Math.min(Math.max(dragStartOffset.value + event.translationY, 0), maxOffset));
			const from = positions.value[id];
			const to = Math.round(offset.value / rowHeight);
			if (to !== from) {
				positions.set(moveIndex(positions.value, from, to));
			}
		},
		onDeactivate: () => {
			offset.set(
				withTiming(positions.value[id] * rowHeight, undefined, finished => {
					activeId.set(null);
					if (finished) {
						scheduleOnRN(onDrop, orderedIds(positions.value));
					}
				})
			);
		}
	});

	const animatedStyle = useAnimatedStyle(() => ({
		zIndex: activeId.value === id ? 1 : 0,
		transform: [{ translateY: offset.value }]
	}));

	const onAccessibilityAction = (event: AccessibilityActionEvent) => {
		onMoveBy(index, event.nativeEvent.actionName === 'moveUp' ? -1 : 1);
	};

	return (
		<Animated.View
			style={[styles.row, animatedStyle]}
			accessible
			accessibilityLabel={title}
			accessibilityHint={i18n.t('Drag_to_reorder')}
			accessibilityActions={[
				{ name: 'moveUp', label: i18n.t('Move_up') },
				{ name: 'moveDown', label: i18n.t('Move_down') }
			]}
			onAccessibilityAction={onAccessibilityAction}
			testID={`category-order-row-${id}`}>
			{children(dragGesture)}
		</Animated.View>
	);
};

export default SortableRow;
