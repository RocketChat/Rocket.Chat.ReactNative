import React from 'react';
import {
	requireNativeComponent,
	StyleSheet,
	type StyleProp,
	type ViewStyle,
	type LayoutChangeEvent,
	type ScrollViewProps,
	type ViewProps
} from 'react-native';

import { isAndroid } from '../../../../lib/methods/helpers';

// Android-only native ScrollView that fixes TalkBack traversal order for inverted FlatLists.
// Used via FlatList's renderScrollComponent. VirtualizedList passes multiple children (cells).

const NativeInvertedScrollView = isAndroid ? requireNativeComponent<ScrollViewProps>('InvertedScrollView') : null;

const NativeInvertedScrollContentView = isAndroid
	? requireNativeComponent<ViewProps & { removeClippedSubviews?: boolean }>('InvertedScrollContentView')
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

	const preserveChildren = maintainVisibleContentPosition != null || (isAndroid && props.snapToAlignment != null);

	const hasStickyHeaders = Array.isArray(stickyHeaderIndices) && stickyHeaderIndices.length > 0;

	const contentContainerStyleArray = [props.horizontal ? { flexDirection: 'row' } : null, contentContainerStyle];

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
		<NativeInvertedScrollView {...restWithoutStyle} style={StyleSheet.compose(baseStyle, style)}>
			<NativeInvertedScrollContentView
				{...contentSizeChangeProps}
				removeClippedSubviews={isAndroid && hasStickyHeaders ? false : removeClippedSubviews}
				collapsable={false}
				collapsableChildren={!preserveChildren}
				style={contentContainerStyleArray as StyleProp<ViewStyle>}>
				{children}
			</NativeInvertedScrollContentView>
		</NativeInvertedScrollView>
	);
};

const styles = StyleSheet.create({
	baseVertical: {
		flexGrow: 1,
		flexShrink: 1,
		flexDirection: 'column',
		overflow: 'scroll'
	},
	baseHorizontal: {
		flexGrow: 1,
		flexShrink: 1,
		flexDirection: 'row',
		overflow: 'scroll'
	}
});

export default InvertedScrollView;
