import {
	forwardRef,
	useRef,
	useLayoutEffect,
	type RefAttributes,
	type ComponentRef,
	type ComponentType,
	type MutableRefObject
} from 'react';
import {
	findNodeHandle,
	requireNativeComponent,
	StyleSheet,
	UIManager,
	type StyleProp,
	type ViewStyle,
	type LayoutChangeEvent,
	type ScrollViewProps,
	type ViewProps
} from 'react-native';

const COMMAND_SCROLL_TO = 1;
const COMMAND_SCROLL_TO_END = 2;
const COMMAND_FLASH_SCROLL_INDICATORS = 3;

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

type ScrollViewPropsWithRef = ScrollViewProps & RefAttributes<NativeScrollInstance | null>;
type NativeScrollInstance = ComponentRef<NonNullable<typeof NativeInvertedScrollView>>;
interface IScrollableMethods {
	scrollTo(options?: { x?: number; y?: number; animated?: boolean }): void;
	scrollToEnd(options?: { animated?: boolean }): void;
	flashScrollIndicators(): void;
	getScrollRef(): NativeScrollInstance | null;
	setNativeProps(props: object): void;
}

export type InvertedScrollViewRef = NativeScrollInstance & IScrollableMethods;

const NativeInvertedScrollView = requireNativeComponent<ScrollViewProps>('InvertedScrollView');

const NativeInvertedScrollContentView = requireNativeComponent<ViewProps & { removeClippedSubviews?: boolean }>(
	'InvertedScrollContentView'
);

const InvertedScrollView = forwardRef<InvertedScrollViewRef, ScrollViewProps>((props, externalRef) => {
	const internalRef = useRef<NativeScrollInstance | null>(null);

	useLayoutEffect(() => {
		const node = internalRef.current as any;

		if (node) {
			// 1. Implementation of scrollTo
			node.scrollTo = (options?: { x?: number; y?: number; animated?: boolean }) => {
				const tag = findNodeHandle(node);
				if (tag != null) {
					const x = options?.x || 0;
					const y = options?.y || 0;
					const animated = options?.animated !== false;
					UIManager.dispatchViewManagerCommand(tag, COMMAND_SCROLL_TO, [x, y, animated]);
				}
			};

			// 2. Implementation of scrollToEnd
			node.scrollToEnd = (options?: { animated?: boolean }) => {
				const tag = findNodeHandle(node);
				if (tag != null) {
					const animated = options?.animated !== false;
					UIManager.dispatchViewManagerCommand(tag, COMMAND_SCROLL_TO_END, [animated]);
				}
			};

			// 3. Implementation of flashScrollIndicators
			node.flashScrollIndicators = () => {
				const tag = findNodeHandle(node as any);
				if (tag !== null) {
					UIManager.dispatchViewManagerCommand(tag, COMMAND_FLASH_SCROLL_INDICATORS, []);
				}
			};

			node.getScrollRef = () => node;
			const originalSetNativeProps = (node as any).setNativeProps;
			if (typeof originalSetNativeProps !== 'function') {
				node.setNativeProps = (_nativeProps: object) => {};
			}
		}
	}, []);

	// Callback Ref to handle merging internal and external refs
	const setRef = (node: NativeScrollInstance | null) => {
		internalRef.current = node;

		if (typeof externalRef === 'function') {
			externalRef(node as InvertedScrollViewRef);
		} else if (externalRef) {
			(externalRef as MutableRefObject<NativeScrollInstance | null>).current = node;
		}
	};

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

	const preserveChildren = maintainVisibleContentPosition != null || snapToAlignment != null;
	const hasStickyHeaders = Array.isArray(stickyHeaderIndices) && stickyHeaderIndices.length > 0;

	const contentContainerStyleArray = [props.horizontal ? { flexDirection: 'row' as const } : null, contentContainerStyle];

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

	if (!NativeInvertedScrollView || !NativeInvertedScrollContentView) {
		return null;
	}
	const ScrollView = NativeInvertedScrollView as ComponentType<ScrollViewPropsWithRef>;
	const ContentView = NativeInvertedScrollContentView as ComponentType<ViewProps & { removeClippedSubviews?: boolean }>;

	return (
		<ScrollView ref={setRef} {...restWithoutStyle} style={StyleSheet.compose(baseStyle, style)} horizontal={horizontal}>
			<ContentView
				{...contentSizeChangeProps}
				removeClippedSubviews={hasStickyHeaders ? false : removeClippedSubviews}
				collapsable={false}
				collapsableChildren={!preserveChildren}
				style={contentContainerStyleArray as StyleProp<ViewStyle>}>
				{children}
			</ContentView>
		</ScrollView>
	);
});

InvertedScrollView.displayName = 'InvertedScrollView';

export default InvertedScrollView;
