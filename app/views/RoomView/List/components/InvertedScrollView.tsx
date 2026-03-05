import React, { forwardRef } from 'react';
import { ScrollView, requireNativeComponent, type ScrollViewProps, type ViewProps } from 'react-native';

const NativeInvertedScrollContentView = requireNativeComponent<ViewProps>('InvertedScrollContentView');

/**
 * Android-only scroll component that wraps the standard ScrollView but uses a native content view
 * that reverses accessibility traversal order. This fixes TalkBack reading inverted FlatList items
 * in the wrong order, while preserving all ScrollView JS-side behavior (responder handling,
 * momentum events, touch coordination).
 */
const InvertedScrollView = forwardRef<ScrollView, ScrollViewProps>((props, ref) => {
	const { children, ...rest } = props;

	return (
		<ScrollView ref={ref} {...rest}>
			<NativeInvertedScrollContentView collapsable={false}>{children}</NativeInvertedScrollContentView>
		</ScrollView>
	);
});

InvertedScrollView.displayName = 'InvertedScrollView';

export default InvertedScrollView;
