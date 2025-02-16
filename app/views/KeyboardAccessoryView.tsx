import React, { useEffect, useRef, useState } from 'react';
import { View, Keyboard, LayoutAnimation, Platform, type KeyboardEvent, StyleSheet } from 'react-native';
import { useKeyboard } from '@react-native-community/hooks';
import type { ITrackingView } from '../containers/MessageComposer';

interface KeyboardAccessoryViewProps {
    renderContent: () => React.ReactNode;
    kbInputRef?: React.RefObject<any>;
    kbComponent?: string | null;
    kbInitialProps?: any;
    onKeyboardResigned?: () => void;
    onItemSelected?: (keyboardId: string, params: any) => void;
    trackInteractive?: boolean;
    requiresSameParentToManageScrollView?: boolean;
    addBottomView?: boolean;
    bottomViewColor?: string;
    iOSScrollBehavior?: any;
    onHeightChanged?: (height: number) => void;
}

function KeyboardAccessoryView({ renderContent, onKeyboardResigned, onHeightChanged, bottomViewColor }: KeyboardAccessoryViewProps, ref: React.ForwardedRef<ITrackingView>) {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const viewRef = useRef<View>(null);
    const keyboard = useKeyboard();

    const handleKeyboardHide = React.useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(0);
        onKeyboardResigned?.();
    }, [onKeyboardResigned]);

    useEffect(() => {
        const showListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            handleKeyboardShow
        );
        const hideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            handleKeyboardHide
        );

        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, [handleKeyboardHide]);

    useEffect(() => {
        if (ref) {
            (ref as any).current = {
                resetTracking: () => {},
                getNativeProps: () => ({ trackingViewHeight: contentHeight })
            };
        }
    }, [contentHeight, ref]);

    const handleKeyboardShow = (event: KeyboardEvent) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(event.endCoordinates.height);
    };

    

    const handleLayout = (event: any) => {
        const height = event.nativeEvent.layout.height;
        setContentHeight(height);
        onHeightChanged?.(height);
    };

    return (
        <View
            ref={viewRef}
            style={[
                styles.container,
                { backgroundColor: bottomViewColor }
            ]}
            onLayout={handleLayout}
        >
            {renderContent()}
            {keyboard.keyboardShown && <View style={{ height: keyboardHeight }} />}
        </View>
    );
}

const KeyboardAccessoryViewRef = React.forwardRef(
    KeyboardAccessoryView
);

const styles = StyleSheet.create({
    container: {
        width: '100%'
    }
});

export default KeyboardAccessoryViewRef;
