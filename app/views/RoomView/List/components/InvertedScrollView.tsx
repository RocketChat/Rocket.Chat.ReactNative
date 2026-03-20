import React, { forwardRef } from 'react';
import { requireNativeComponent, type ScrollViewProps, type ViewProps, StyleSheet } from 'react-native';

interface IInvertedScrollContentViewProps extends ViewProps {
	exitFocusNativeId?: string;
}

interface IInvertedScrollViewNativeProps extends ScrollViewProps {
	exitFocusNativeId?: string;
}

const NativeInvertedScrollView = requireNativeComponent<IInvertedScrollViewNativeProps>('InvertedScrollView');
const NativeInvertedScrollContentView = requireNativeComponent<IInvertedScrollContentViewProps>('InvertedScrollContentView');
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

const InvertedScrollView = forwardRef<any, InvertedScrollViewProps>((props, ref) => {
	const { children, horizontal, ...rest } = props;
	const ContentView = NativeInvertedScrollContentView as React.ComponentType<
		ViewProps & { removeClippedSubviews?: boolean; isInvertedContent?: boolean; exitFocusNativeId?: string }
	>;
	const ScrollContainer = NativeInvertedScrollView as React.ComponentType<IInvertedScrollViewNativeProps & { ref?: any }>;
	const baseStyle = horizontal ? styles.baseHorizontal : styles.baseVertical;
	const { style, ...restWithoutStyle } = rest;
	return (
		<ScrollContainer
			ref={ref}
			{...(restWithoutStyle as IInvertedScrollViewNativeProps)}
			exitFocusNativeId={props.exitFocusNativeId}
			style={StyleSheet.compose(baseStyle, style)}>
			<ContentView isInvertedContent={true} collapsable={false}>
				{children}
			</ContentView>
		</ScrollContainer>
	);
});

InvertedScrollView.displayName = 'InvertedScrollView';

export default InvertedScrollView;
