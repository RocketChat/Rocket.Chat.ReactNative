import React, { 
    forwardRef, 
    useRef, 
    useLayoutEffect 
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

import { isAndroid } from '../../../../lib/methods/helpers';


const COMMAND_SCROLL_TO = 1;
const COMMAND_SCROLL_TO_END = 2;
const COMMAND_FLASH_SCROLL_INDICATORS = 3;

// ----------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------

// The instance type of the native HostComponent (what the ref receives), not the Ref type.
type NativeScrollInstance = React.ComponentRef<NonNullable<typeof NativeInvertedScrollView>>;

// Interface for the methods we are dynamically attaching
interface ScrollableMethods {
    scrollTo(options?: { x?: number; y?: number; animated?: boolean }): void;
    scrollToEnd(options?: { animated?: boolean }): void;
    flashScrollIndicators(): void;
    getScrollRef(): NativeScrollInstance | null;
    setNativeProps(props: object): void;
}

// The final Ref type exposed to consumers (Intersection of Native + Custom)
export type InvertedScrollViewRef = NativeScrollInstance & ScrollableMethods;

// ----------------------------------------------------------------------
// Native Component Requirements
// ----------------------------------------------------------------------

const NativeInvertedScrollView = isAndroid ? requireNativeComponent<ScrollViewProps>('InvertedScrollView') : null;

const NativeInvertedScrollContentView = isAndroid
   ? requireNativeComponent<ViewProps & { removeClippedSubviews?: boolean }>('InvertedScrollContentView')
    : null;


const InvertedScrollView = forwardRef<InvertedScrollViewRef, ScrollViewProps>((props, externalRef) => {
	const internalRef = useRef<NativeScrollInstance | null>(null);  
    // internalRef captures the Host Instance for local manipulation

    // useLayoutEffect runs synchronously after DOM mutations.
    // This guarantees methods are attached before the parent can access the ref.
    useLayoutEffect(() => {
        const node = internalRef.current;
        
        if (node) {
            // Cast to 'any' to allow dynamic property assignment
            const patchedNode = node as any;

            // 1. Implementation of scrollTo
            patchedNode.scrollTo = (options?: { x?: number; y?: number; animated?: boolean }) => {
                const tag = findNodeHandle(node);
                if (tag!= null) {
                    const x = options?.x || 0;
                    const y = options?.y || 0;
                    const animated = options?.animated !== false;
                    UIManager.dispatchViewManagerCommand(tag, COMMAND_SCROLL_TO, [x, y, animated]);
                }
            };

            // 2. Implementation of scrollToEnd
            patchedNode.scrollToEnd = (options?: { animated?: boolean }) => {
                const tag = findNodeHandle(node);
                if (tag!= null) {
                    const animated = options?.animated !== false;
                    UIManager.dispatchViewManagerCommand(tag, COMMAND_SCROLL_TO_END, [animated]);
                }
            };

            // 3. Implementation of flashScrollIndicators
            patchedNode.flashScrollIndicators = () => {
                const tag = findNodeHandle(node as any);
                if (tag !== null) {
                    UIManager.dispatchViewManagerCommand(tag, COMMAND_FLASH_SCROLL_INDICATORS, []);
                }
            };

            // 4. Implementation of getScrollRef (Legacy support)
            patchedNode.getScrollRef = () => node;
            
            // 5. Ensure setNativeProps exists (it usually does on Host Instances, but explicit is safer)
            if (typeof patchedNode.setNativeProps!== 'function') {
                patchedNode.setNativeProps = (nativeProps: object) => {
                     // Check again if the underlying node has the method hidden
                     if (node && typeof (node as any).setNativeProps === 'function') {
                         (node as any).setNativeProps(nativeProps);
                     }
                };
            }
        }
    });

    // Callback Ref to handle merging internal and external refs
    const setRef = (node: NativeScrollInstance | null) => {
        internalRef.current = node;
        
        if (typeof externalRef === 'function') {
            externalRef(node as InvertedScrollViewRef);
        } else if (externalRef) {
            (externalRef as React.MutableRefObject<NativeScrollInstance | null>).current = node;
        }
    };

    // Extract specific props that require transformation
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

    // Logic preserved from original class component
    const preserveChildren = maintainVisibleContentPosition != null || (isAndroid && snapToAlignment != null);
    const hasStickyHeaders = Array.isArray(stickyHeaderIndices) && stickyHeaderIndices.length > 0;

    // Construct styles
    const contentContainerStyleArray = [props.horizontal ? { flexDirection: 'row' as const } : null, contentContainerStyle];

    // Wrap onContentSizeChange to normalize the event payload
    const contentSizeChangeProps = onContentSizeChange == null
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
	type ScrollViewPropsWithRef = ScrollViewProps & React.RefAttributes<NativeScrollInstance | null>;
	const ScrollView = NativeInvertedScrollView as React.ComponentType<ScrollViewPropsWithRef>;
	const ContentView = NativeInvertedScrollContentView as React.ComponentType<ViewProps & { removeClippedSubviews?: boolean }>;

	return (
		<ScrollView
			ref={setRef}
			{...restWithoutStyle}
			style={StyleSheet.compose(baseStyle, style)}
			horizontal={horizontal}
		>
			<ContentView
				{...contentSizeChangeProps}
				removeClippedSubviews={isAndroid && hasStickyHeaders ? false : removeClippedSubviews}
				collapsable={false}
				collapsableChildren={!preserveChildren}
				style={contentContainerStyleArray as StyleProp<ViewStyle>}
			>
				{children}
			</ContentView>
		</ScrollView>
	);
});

InvertedScrollView.displayName = 'InvertedScrollView';

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