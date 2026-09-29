import { Component, type ComponentType, createRef, type MutableRefObject } from 'react';
import {
	type HostInstance,
	StyleSheet,
	View,
	findNodeHandle,
	type LayoutChangeEvent,
	type ScrollViewProps,
	processColor
} from 'react-native';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NativeComponentRegistry = require('react-native/Libraries/NativeComponent/NativeComponentRegistry') as {
	get: (name: string, viewConfigProvider: () => object) => ComponentType<any>;
};

const pointsDiffer = require('react-native/Libraries/Utilities/differ/pointsDiffer').default as (
	a: object | null,
	b: object | null
) => boolean;

interface Props extends Omit<ScrollViewProps, 'scrollViewRef'> {
	exitFocusNativeId?: string;
}

const NativeVisualOrderScrollView = NativeComponentRegistry.get('VisualOrderScrollView', () => ({
	uiViewClassName: 'VisualOrderScrollView',
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
		exitFocusNativeId: true
	}
}));

interface VisualOrderScrollViewCommands {
	scrollTo: (viewRef: any, x: number, y: number, animated: boolean) => void;
	scrollToEnd: (viewRef: any, animated: boolean) => void;
	flashScrollIndicators: (viewRef: any) => void;
}

const Commands = codegenNativeCommands<VisualOrderScrollViewCommands>({
	supportedCommands: ['scrollTo', 'scrollToEnd', 'flashScrollIndicators']
});

export default class VisualOrderScrollView extends Component<Props> {
	private scrollRef = createRef<any>();

	private handleLayout = (e: LayoutChangeEvent) => {
		this.props.onLayout?.(e);
	};

	private handleContentOnLayout = (e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		this.props.onContentSizeChange?.(width, height);
	};

	private setNativeRef = (instance: any) => {
		(this.scrollRef as MutableRefObject<any>).current = instance;
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

	measure: HostInstance['measure'] = callback => this.scrollRef.current?.measure(callback);

	measureInWindow: HostInstance['measureInWindow'] = callback => this.scrollRef.current?.measureInWindow(callback);

	measureLayout: HostInstance['measureLayout'] = (relativeToNativeNode, onSuccess, onFail) =>
		this.scrollRef.current?.measureLayout(relativeToNativeNode, onSuccess, onFail);

	getScrollableNode = () => findNodeHandle(this.scrollRef.current);

	getNativeScrollRef = () => this.scrollRef.current;

	getScrollResponder = () => this;

	render() {
		const {
			horizontal,
			children,
			style,
			contentContainerStyle,
			onContentSizeChange,
			contentOffset,
			maintainVisibleContentPosition,
			scrollEnabled,
			showsVerticalScrollIndicator,
			scrollEventThrottle,
			removeClippedSubviews,
			testID,
			accessibilityElementsHidden,
			importantForAccessibility,
			onScroll,
			onScrollBeginDrag,
			onScrollEndDrag,
			onMomentumScrollBegin,
			onMomentumScrollEnd,
			exitFocusNativeId
		} = this.props;
		const contentStyle = [horizontal ? styles.contentContainerHorizontal : null, contentContainerStyle];
		const baseStyle = horizontal ? styles.baseHorizontal : styles.baseVertical;

		return (
			<NativeVisualOrderScrollView
				ref={this.setNativeRef}
				horizontal={horizontal}
				contentOffset={contentOffset}
				maintainVisibleContentPosition={maintainVisibleContentPosition}
				scrollEnabled={scrollEnabled}
				showsVerticalScrollIndicator={showsVerticalScrollIndicator}
				scrollEventThrottle={scrollEventThrottle}
				removeClippedSubviews={removeClippedSubviews}
				sendMomentumEvents={!!(onMomentumScrollBegin || onMomentumScrollEnd)}
				testID={testID}
				accessibilityElementsHidden={accessibilityElementsHidden}
				importantForAccessibility={importantForAccessibility}
				onScroll={onScroll}
				onScrollBeginDrag={onScrollBeginDrag}
				onScrollEndDrag={onScrollEndDrag}
				onMomentumScrollBegin={onMomentumScrollBegin}
				onMomentumScrollEnd={onMomentumScrollEnd}
				exitFocusNativeId={exitFocusNativeId}
				style={StyleSheet.compose(baseStyle, style)}
				onLayout={this.handleLayout}>
				<View
					onLayout={onContentSizeChange ? this.handleContentOnLayout : undefined}
					style={contentStyle}
					removeClippedSubviews={removeClippedSubviews}
					collapsable={false}>
					{children}
				</View>
			</NativeVisualOrderScrollView>
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
