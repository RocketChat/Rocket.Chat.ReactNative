import React from 'react';
import {
	StyleSheet,
	findNodeHandle,
	type LayoutChangeEvent,
	requireNativeComponent,
	type ScrollViewProps,
	type ViewProps
} from 'react-native';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';

interface InvertedScrollContentViewProps extends ViewProps {
	isInvertedContent?: boolean;
}

interface InvertedScrollViewNativeProps extends ScrollViewProps {
	exitFocusNativeId?: string;
}

interface Props extends Omit<ScrollViewProps, 'scrollViewRef'> {
	exitFocusNativeId?: string;
}

const NativeInvertedScrollView = requireNativeComponent<InvertedScrollViewNativeProps>('InvertedScrollView');
const NativeInvertedScrollContentView = requireNativeComponent<InvertedScrollContentViewProps>('InvertedScrollContentView');

// Minimal compatibility wrapper used by FlatList/VirtualizedList when RoomView renders a custom
// Android scroll component for inverted content. Keep these methods in sync with list expectations:
// `scrollTo`, `scrollToEnd`, `flashScrollIndicators`, `getScrollableNode`, `getNativeScrollRef`,
// and `getScrollResponder`. Keyboard/focus traversal logic belongs to native Android classes.
interface InvertedScrollViewCommands {
	scrollTo: (viewRef: React.ElementRef<typeof NativeInvertedScrollView>, x: number, y: number, animated: boolean) => void;
	scrollToEnd: (viewRef: React.ElementRef<typeof NativeInvertedScrollView>, animated: boolean) => void;
	flashScrollIndicators: (viewRef: React.ElementRef<typeof NativeInvertedScrollView>) => void;
}

const Commands = codegenNativeCommands<InvertedScrollViewCommands>({
	supportedCommands: ['scrollTo', 'scrollToEnd', 'flashScrollIndicators']
});

export default class InvertedScrollViewAdapter extends React.Component<Props> {
	private scrollRef = React.createRef<any>();

	private handleLayout = (e: LayoutChangeEvent) => {
		this.props.onLayout?.(e);
	};

	private handleContentOnLayout = (e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		this.props.onContentSizeChange?.(width, height);
	};

	private setNativeRef = (instance: any) => {
		(this.scrollRef as React.MutableRefObject<any>).current = instance;
	};

	// Exposed on the class instance so VirtualizedList's `_scrollRef` has `scrollTo` (used by
	// `scrollToOffset`, `scrollToIndex`, `scrollToEnd`). `findNodeHandle` supports layout helpers
	// that call `getScrollableNode` when present.
	scrollTo = (options?: { x?: number; y?: number; animated?: boolean } | number) => {
		let x = 0;
		let y = 0;
		let animated = true;
		if (typeof options === 'number') {
			y = options;
		} else if (options) {
			x = options.x ?? 0;
			y = options.y ?? 0;
			animated = options.animated !== false;
		}
		if (this.scrollRef.current) {
			Commands.scrollTo(this.scrollRef.current, x, y, animated);
		}
	};

	scrollToEnd = (options?: { animated?: boolean }) => {
		if (this.scrollRef.current) {
			Commands.scrollToEnd(this.scrollRef.current, options?.animated !== false);
		}
	};

	flashScrollIndicators = () => {
		if (this.scrollRef.current) {
			Commands.flashScrollIndicators(this.scrollRef.current);
		}
	};

	getScrollableNode = () => findNodeHandle(this.scrollRef.current);

	getNativeScrollRef = () => this.scrollRef.current;

	getScrollResponder = () => this;

	render() {
		const { horizontal, children, style, contentContainerStyle, onContentSizeChange, ...rest } = this.props;
		const contentStyle = [horizontal ? styles.contentContainerHorizontal : null, contentContainerStyle];
		const baseStyle = horizontal ? styles.baseHorizontal : styles.baseVertical;
		const ScrollContainer = NativeInvertedScrollView as React.ComponentClass<InvertedScrollViewNativeProps & ViewProps>;

		return (
			<ScrollContainer
				ref={this.setNativeRef}
				{...rest}
				style={StyleSheet.compose(baseStyle, style)}
				onLayout={this.handleLayout}>
				<NativeInvertedScrollContentView
					onLayout={onContentSizeChange ? this.handleContentOnLayout : undefined}
					style={contentStyle}
					removeClippedSubviews={this.props.removeClippedSubviews}
					collapsable={false}
					isInvertedContent>
					{children}
				</NativeInvertedScrollContentView>
			</ScrollContainer>
		);
	}
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
	},
	contentContainerHorizontal: {
		flexDirection: 'row'
	}
});
