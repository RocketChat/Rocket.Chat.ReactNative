import React from 'react';
import {
	Platform,
	requireNativeComponent,
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
		...rest
	} = props;

	const preserveChildren =
		maintainVisibleContentPosition != null ||
		(Platform.OS === 'android' && props.snapToAlignment != null);

	const handleContentLayout = (e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		onContentSizeChange?.(width, height);
	};

	return (
		<NativeInvertedScrollView {...rest}>
			<NativeInvertedScrollContentView
				style={contentContainerStyle}
				removeClippedSubviews={removeClippedSubviews}
				collapsable={false}
				collapsableChildren={!preserveChildren}
				onLayout={onContentSizeChange != null ? handleContentLayout : undefined}
			>
				{children}
			</NativeInvertedScrollContentView>
		</NativeInvertedScrollView>
	);
};

export default InvertedScrollView;
