import React, { forwardRef } from 'react';
import { ScrollView, requireNativeComponent, type ScrollViewProps, type ViewProps } from 'react-native';

interface IInvertedScrollContentViewProps extends ViewProps {
	exitFocusNativeId?: string;
}

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

const InvertedScrollView = forwardRef<ScrollView, InvertedScrollViewProps>((props, ref) => {
	const { children, exitFocusNativeId, ...rest } = props;

	return (
		<ScrollView ref={ref} {...rest}>
			<NativeInvertedScrollContentView collapsable={false} exitFocusNativeId={exitFocusNativeId}>
				{children}
			</NativeInvertedScrollContentView>
		</ScrollView>
	);
});

InvertedScrollView.displayName = 'InvertedScrollView';

export default InvertedScrollView;
