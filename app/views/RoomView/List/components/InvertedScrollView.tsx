import React from 'react';
import {
	Platform,
	requireNativeComponent,
	StyleSheet,
	type LayoutChangeEvent,
	type ScrollViewProps,
	type ViewProps
} from 'react-native';

/**
 * Android-only native ScrollView that fixes TalkBack traversal order for inverted FlatLists.
 * Used via FlatList's renderScrollComponent. VirtualizedList passes multiple children (cells)
 * via cloneElement; Android ScrollView accepts only one direct child, so we wrap them in
 * InvertedScrollContentView (native), which (1) satisfies the one-child constraint and
 * (2) reports its children in reversed order for accessibility so TalkBack matches visual order.
 *
 * Content container props and style match the default ScrollView (ScrollView.js) exactly.
 */
const NativeInvertedScrollView =
	Platform.OS === 'android'
		? requireNativeComponent<ScrollViewProps>('InvertedScrollView')
		: null;

const NativeInvertedScrollContentView =
	Platform.OS === 'android'
		? requireNativeComponent<ViewProps & { removeClippedSubviews?: boolean }>(
				'InvertedScrollContentView'
			)
		: null;

const InvertedScrollView = (props: ScrollViewProps) => {
	if (NativeInvertedScrollView == null || NativeInvertedScrollContentView == null) {
		return null;
	}
	const {
		children,
		contentContainerStyle,
		onContentSizeChange,
		removeClippedSubviews,
		maintainVisibleContentPosition,
		snapToAlignment,
		stickyHeaderIndices,
		...rest
	} = props;

	const preserveChildren =
		maintainVisibleContentPosition != null ||
		(Platform.OS === 'android' && props.snapToAlignment != null);

	const hasStickyHeaders =
		Array.isArray(stickyHeaderIndices) && stickyHeaderIndices.length > 0;

	const contentContainerStyleArray = [
		props.horizontal ? { flexDirection: 'row' as const } : null,
		contentContainerStyle
	];

	const contentSizeChangeProps =
		onContentSizeChange == null
			? undefined
			: {
					onLayout: (e: LayoutChangeEvent) => {
						const { width, height } = e.nativeEvent.layout;
						onContentSizeChange(width, height);
					}
				};

	const horizontal = !!props.horizontal;
	const baseStyle = horizontal ? styles.baseHorizontal : styles.baseVertical;
	const { style, ...restWithoutStyle } = rest;

	return (
		<NativeInvertedScrollView
			{...restWithoutStyle}
			style={StyleSheet.compose(baseStyle, style)}
		>
			<NativeInvertedScrollContentView
				{...contentSizeChangeProps}
				style={contentContainerStyleArray}
				removeClippedSubviews={
					Platform.OS === 'android' && hasStickyHeaders ? false : removeClippedSubviews
				}
				collapsable={false}
				collapsableChildren={!preserveChildren}
			>
				{children}
			</NativeInvertedScrollContentView>
		</NativeInvertedScrollView>
	);
};

const styles = StyleSheet.create({
	baseVertical: {
		flexGrow: 1,
		flexShrink: 1,
		flexDirection: 'column' as const,
		overflow: 'scroll' as const
	},
	baseHorizontal: {
		flexGrow: 1,
		flexShrink: 1,
		flexDirection: 'row' as const,
		overflow: 'scroll' as const
	}
});

export default InvertedScrollView;
