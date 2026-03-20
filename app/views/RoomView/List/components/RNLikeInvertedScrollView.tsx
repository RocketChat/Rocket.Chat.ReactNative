import React from 'react';
import {
	Keyboard,
	Platform,
	StyleSheet,
	TextInput,
	type GestureResponderEvent,
	type LayoutChangeEvent,
	requireNativeComponent,
	type ScrollViewProps,
	type ViewProps
} from 'react-native';

interface InvertedScrollContentViewProps extends ViewProps {
	isInvertedContent?: boolean;
}

interface InvertedScrollViewNativeProps extends ScrollViewProps {
	exitFocusNativeId?: string;
}

interface Props extends ScrollViewProps {
	exitFocusNativeId?: string;
	scrollViewRef?: React.Ref<any>;
}

interface State {
	layoutHeight: number | null;
}

const NativeInvertedScrollView = requireNativeComponent<InvertedScrollViewNativeProps>('InvertedScrollView');
const NativeInvertedScrollContentView = requireNativeComponent<InvertedScrollContentViewProps>('InvertedScrollContentView');

const IS_ANIMATING_TOUCH_START_THRESHOLD_MS = 16;

class RNLikeInvertedScrollView extends React.Component<Props, State> {
	private scrollRef = React.createRef<any>();
	private _keyboardMetrics: { height: number } | null = null;
	private _isTouching = false;
	private _lastMomentumScrollBeginTime = 0;
	private _lastMomentumScrollEndTime = 0;
	private _observedScrollSinceBecomingResponder = false;
	private _subscriptionKeyboardDidShow?: { remove: () => void };
	private _subscriptionKeyboardDidHide?: { remove: () => void };

	state: State = {
		layoutHeight: null
	};

	componentDidMount() {
		this._subscriptionKeyboardDidShow = Keyboard.addListener('keyboardDidShow', this.onKeyboardDidShow);
		this._subscriptionKeyboardDidHide = Keyboard.addListener('keyboardDidHide', this.onKeyboardDidHide);
	}

	componentWillUnmount() {
		this._subscriptionKeyboardDidShow?.remove();
		this._subscriptionKeyboardDidHide?.remove();
	}

	private onKeyboardDidShow = (e: any) => {
		this._keyboardMetrics = e?.endCoordinates ?? { height: 0 };
	};

	private onKeyboardDidHide = (_e: any) => {
		this._keyboardMetrics = null;
	};

	private isAnimating = () => {
		const now = global.performance.now();
		const timeSinceLastMomentumScrollEnd = now - this._lastMomentumScrollEndTime;
		return (
			timeSinceLastMomentumScrollEnd < IS_ANIMATING_TOUCH_START_THRESHOLD_MS ||
			this._lastMomentumScrollEndTime < this._lastMomentumScrollBeginTime
		);
	};

	private keyboardEventsAreUnreliable = () => Platform.OS === 'android' && Platform.Version < 30;

	private keyboardIsDismissible = () => {
		const currentlyFocusedInput = TextInput.State.currentlyFocusedInput?.();
		const hasFocusedTextInput = currentlyFocusedInput != null;
		const softKeyboardMayBeOpen = this._keyboardMetrics != null || this.keyboardEventsAreUnreliable();
		return hasFocusedTextInput && softKeyboardMayBeOpen;
	};

	private handleLayout = (e: LayoutChangeEvent) => {
		if (this.props.invertStickyHeaders === true) {
			this.setState({ layoutHeight: e.nativeEvent.layout.height });
		}
		this.props.onLayout?.(e);
	};

	private handleContentOnLayout = (e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		this.props.onContentSizeChange?.(width, height);
	};

	private handleScroll = (e: any) => {
		this._observedScrollSinceBecomingResponder = true;
		this.props.onScroll?.(e);
	};

	private handleMomentumScrollBegin = (e: any) => {
		this._lastMomentumScrollBeginTime = global.performance.now();
		this.props.onMomentumScrollBegin?.(e);
	};

	private handleMomentumScrollEnd = (e: any) => {
		this._lastMomentumScrollEndTime = global.performance.now();
		this.props.onMomentumScrollEnd?.(e);
	};

	private handleResponderGrant = (e: GestureResponderEvent) => {
		this._observedScrollSinceBecomingResponder = false;
		this.props.onResponderGrant?.(e);
	};

	private handleResponderRelease = (e: GestureResponderEvent) => {
		this._isTouching = e.nativeEvent.touches.length !== 0;
		this.props.onResponderRelease?.(e);
	};

	private handleResponderTerminationRequest = () => !this._observedScrollSinceBecomingResponder;

	private handleScrollShouldSetResponder = () => {
		if (this.props.disableScrollViewPanResponder === true) {
			return false;
		}
		return this._isTouching;
	};

	private handleStartShouldSetResponder = (e: GestureResponderEvent) => {
		if (this.props.disableScrollViewPanResponder === true) {
			return false;
		}
		const currentlyFocusedInput = TextInput.State.currentlyFocusedInput?.();
		if (
			this.props.keyboardShouldPersistTaps === 'handled' &&
			this.keyboardIsDismissible() &&
			e.target !== currentlyFocusedInput
		) {
			return true;
		}
		return false;
	};

	private handleStartShouldSetResponderCapture = (e: GestureResponderEvent) => {
		if (this.isAnimating()) {
			return true;
		}
		if (this.props.disableScrollViewPanResponder === true) {
			return false;
		}
		const { keyboardShouldPersistTaps } = this.props;
		const keyboardNeverPersistTaps = !keyboardShouldPersistTaps || keyboardShouldPersistTaps === 'never';
		return keyboardNeverPersistTaps && this.keyboardIsDismissible() && e.target != null;
	};

	private setRefs = (instance: any) => {
		this.scrollRef.current = instance;
		const { scrollViewRef } = this.props;
		if (!scrollViewRef) {
			return;
		}
		if (typeof scrollViewRef === 'function') {
			scrollViewRef(instance);
			return;
		}
		(scrollViewRef as React.MutableRefObject<any>).current = instance;
	};

	render() {
		const { horizontal, children, style, contentContainerStyle, onContentSizeChange, ...rest } = this.props;
		const contentStyle = [horizontal ? styles.contentContainerHorizontal : null, contentContainerStyle];
		const baseStyle = horizontal ? styles.baseHorizontal : styles.baseVertical;
		const ScrollContainer = NativeInvertedScrollView as any;

		return (
			<ScrollContainer
				ref={this.setRefs}
				{...rest}
				style={StyleSheet.compose(baseStyle, style)}
				onLayout={this.handleLayout}
				onMomentumScrollBegin={this.handleMomentumScrollBegin}
				onMomentumScrollEnd={this.handleMomentumScrollEnd}
				onResponderGrant={this.handleResponderGrant}
				onResponderRelease={this.handleResponderRelease}
				onResponderTerminationRequest={this.handleResponderTerminationRequest}
				onScrollShouldSetResponder={this.handleScrollShouldSetResponder}
				onStartShouldSetResponder={this.handleStartShouldSetResponder}
				onStartShouldSetResponderCapture={this.handleStartShouldSetResponderCapture}
				onScroll={this.handleScroll}>
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

const Wrapper = React.forwardRef<any, Props>((props, ref) => <RNLikeInvertedScrollView {...props} scrollViewRef={ref} />);

Wrapper.displayName = 'RNLikeInvertedScrollView';

export default Wrapper;
