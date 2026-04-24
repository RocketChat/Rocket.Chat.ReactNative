import React from 'react';
import { StyleSheet, findNodeHandle, type LayoutChangeEvent, type ScrollViewProps, processColor } from 'react-native';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';

// NativeComponentRegistry.get() registers components as proper Fabric host components.
// requireNativeComponent() uses the legacy interop layer, which breaks Fabric's touch
// event routing: when Fabric-rendered children (FlatList cells with pressable elements)
// are nested inside a legacy interop node, Fabric's event router cannot traverse the
// shadow tree boundary and drops all interaction events. newArchEnabled=true exposes this.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NativeComponentRegistry = require('react-native/Libraries/NativeComponent/NativeComponentRegistry') as {
	get: (name: string, viewConfigProvider: () => object) => React.ComponentType<any>;
};

const pointsDiffer = require('react-native/Libraries/Utilities/differ/pointsDiffer').default as (
	a: object | null,
	b: object | null
) => boolean;

interface Props extends Omit<ScrollViewProps, 'scrollViewRef'> {
	exitFocusNativeId?: string;
}

// Mirrors the Android validAttributes of RCTScrollView (ScrollViewNativeComponent.js)
// extended with our custom exitFocusNativeId prop.
const NativeInvertedScrollView = NativeComponentRegistry.get('InvertedScrollView', () => ({
	uiViewClassName: 'InvertedScrollView',
	bubblingEventTypes: {},
	directEventTypes: {
		topMomentumScrollBegin: { registrationName: 'onMomentumScrollBegin' },
		topMomentumScrollEnd: { registrationName: 'onMomentumScrollEnd' },
		topScroll: { registrationName: 'onScroll' },
		topScrollBeginDrag: { registrationName: 'onScrollBeginDrag' },
		topScrollEndDrag: { registrationName: 'onScrollEndDrag' }
	},
	validAttributes: {
		contentOffset: { diff: pointsDiffer },
		decelerationRate: true,
		disableIntervalMomentum: true,
		maintainVisibleContentPosition: true,
		pagingEnabled: true,
		scrollEnabled: true,
		showsVerticalScrollIndicator: true,
		snapToAlignment: true,
		snapToEnd: true,
		snapToInterval: true,
		snapToOffsets: true,
		snapToStart: true,
		borderBottomLeftRadius: true,
		borderBottomRightRadius: true,
		sendMomentumEvents: true,
		borderRadius: true,
		nestedScrollEnabled: true,
		scrollEventThrottle: true,
		borderStyle: true,
		borderRightColor: { process: processColor },
		borderColor: { process: processColor },
		borderBottomColor: { process: processColor },
		persistentScrollbar: true,
		horizontal: true,
		endFillColor: { process: processColor },
		fadingEdgeLength: true,
		overScrollMode: true,
		borderTopLeftRadius: true,
		scrollPerfTag: true,
		borderTopColor: { process: processColor },
		removeClippedSubviews: true,
		borderTopRightRadius: true,
		borderLeftColor: { process: processColor },
		pointerEvents: true,
		isInvertedVirtualizedList: true,
		exitFocusNativeId: true
	}
}));

const NativeInvertedScrollContentView = NativeComponentRegistry.get('InvertedScrollContentView', () => ({
	uiViewClassName: 'InvertedScrollContentView',
	bubblingEventTypes: {},
	directEventTypes: {},
	validAttributes: {
		isInvertedContent: true,
		removeClippedSubviews: true,
		collapsable: true
	}
}));

interface InvertedScrollViewCommands {
	scrollTo: (viewRef: any, x: number, y: number, animated: boolean) => void;
	scrollToEnd: (viewRef: any, animated: boolean) => void;
	flashScrollIndicators: (viewRef: any) => void;
}

const Commands = codegenNativeCommands<InvertedScrollViewCommands>({
	supportedCommands: ['scrollTo', 'scrollToEnd', 'flashScrollIndicators']
});

export default class InvertedScrollView extends React.Component<Props> {
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

		return (
			<NativeInvertedScrollView
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
			</NativeInvertedScrollView>
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
