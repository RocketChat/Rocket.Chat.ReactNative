import React, { forwardRef } from 'react';
import { type ScrollView, requireNativeComponent, type ScrollViewProps, type ViewProps, StyleSheet } from 'react-native';

interface IInvertedScrollContentViewProps extends ViewProps {
	exitFocusNativeId?: string;
}

const NativeInvertedScrollContentView = requireNativeComponent<IInvertedScrollContentViewProps>('InvertedScrollContentView');
const NativeInvertedScrollView = requireNativeComponent<ScrollViewProps>('InvertedScrollView');
/**
 * Android-only scroll component that wraps the standard ScrollView but uses a native content view
 * that reverses accessibility traversal order. This fixes TalkBack reading inverted FlatList items
 * in the wrong order, while preserving all ScrollView JS-side behavior (responder handling,
 * momentum events, touch coordination).
 */
interface InvertedScrollViewProps extends ScrollViewProps {
	exitFocusNativeId?: string;
}

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

const InvertedScrollView = forwardRef<ScrollView, InvertedScrollViewProps>((props, ref) => {
	const {
		children,
		contentContainerStyle,
		onContentSizeChange,
		removeClippedSubviews,
		maintainVisibleContentPosition,
		snapToAlignment,
		stickyHeaderIndices,
		horizontal,
		...rest
	} = props;
	const ContentView = NativeInvertedScrollContentView as React.ComponentType<
		ViewProps & { removeClippedSubviews?: boolean; isInvertedContent?: boolean; exitFocusNativeId?: string }
	>;
	const baseStyle = horizontal ? styles.baseHorizontal : styles.baseVertical;
	const { style, ...restWithoutStyle } = rest;
	return (
		<NativeInvertedScrollView ref={ref as any} {...restWithoutStyle} style={StyleSheet.compose(baseStyle, style)}>
			<ContentView isInvertedContent={true} collapsable={false} exitFocusNativeId={props.exitFocusNativeId}>
				{children}
			</ContentView>
		</NativeInvertedScrollView>
	);
});

InvertedScrollView.displayName = 'InvertedScrollView';

export default InvertedScrollView;
