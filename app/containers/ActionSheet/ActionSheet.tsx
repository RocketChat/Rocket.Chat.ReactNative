import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { Keyboard, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { Easing, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from '@discord/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { isIOS, isTablet } from '../../lib/methods/helpers';
import { Handle } from './Handle';
import { TActionSheetOptions } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import styles, { ITEM_HEIGHT } from './styles';

export const ACTION_SHEET_ANIMATION_DURATION = 250;
const HANDLE_HEIGHT = 28;
const CANCEL_HEIGHT = 64;

const ANIMATION_CONFIG = {
	duration: ACTION_SHEET_ANIMATION_DURATION,
	// https://easings.net/#easeInOutCubic
	easing: Easing.bezier(0.645, 0.045, 0.355, 1.0)
};

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { colors } = useTheme();
		const { height: windowHeight } = useWindowDimensions();
		const { bottom } = useSafeAreaInsets();
		const bottomSheetRef = useRef<BottomSheet>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setVisible] = useState(false);
		const animatedContentHeight = useSharedValue(0);
		const animatedHandleHeight = useSharedValue(0);
		const animatedDataSnaps = useSharedValue<TActionSheetOptions['snaps']>([]);
		const animatedSnapPoints = useDerivedValue(() => {
			if (animatedDataSnaps.value?.length) {
				return animatedDataSnaps.value;
			}
			const contentWithHandleHeight = animatedContentHeight.value + animatedHandleHeight.value;
			// Bottom sheet requires a default value to work
			if (contentWithHandleHeight === 0) {
				return ['25%'];
			}
			return [contentWithHandleHeight];
		}, [data]);

		const handleContentLayout = useCallback(
			({
				nativeEvent: {
					layout: { height }
				}
			}: LayoutChangeEvent) => {
				/**
				 * This logic is only necessary to prevent the action sheet from
				 * occupying the entire screen when the dynamic content is too big.
				 */
				animatedContentHeight.value = Math.min(height, windowHeight * 0.8);
			},
			[animatedContentHeight, windowHeight]
		);

		const maxSnap = Math.min(
			(ITEM_HEIGHT + 0.5) * (data?.options?.length || 0) +
				HANDLE_HEIGHT +
				// Custom header height
				(data?.headerHeight || 0) +
				// Insets bottom height (Notch devices)
				bottom +
				// Cancel button height
				(data?.hasCancel ? CANCEL_HEIGHT : 0),
			windowHeight * 0.8
		);

		/*
		 * if the action sheet cover more than 60% of the screen height,
		 * we'll provide more one snap of 50%
		 */
		const snaps = maxSnap > windowHeight * 0.6 && !data.snaps ? ['50%', maxSnap] : [maxSnap];

		const toggleVisible = () => setVisible(!isVisible);

		const hide = () => {
			bottomSheetRef.current?.close();
		};

		const show = (options: TActionSheetOptions) => {
			setData(options);
			if (options.snaps?.length) {
				animatedDataSnaps.value = options.snaps;
			}
			toggleVisible();
		};

		useBackHandler(() => {
			if (isVisible) {
				hide();
			}
			return isVisible;
		});

		useEffect(() => {
			if (isVisible) {
				Keyboard.dismiss();
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			}
		}, [isVisible]);

		useImperativeHandle(ref, () => ({
			showActionSheet: show,
			hideActionSheet: hide
		}));

		const renderHandle = () => (
			<>
				<Handle />
				{isValidElement(data?.customHeader) ? data.customHeader : null}
			</>
		);

		const onClose = () => {
			toggleVisible();
			data?.onClose && data?.onClose();
			animatedDataSnaps.value = [];
		};

		const renderBackdrop = useCallback(
			(props: BottomSheetBackdropProps) => (
				<BottomSheetBackdrop
					{...props}
					appearsOnIndex={0}
					// Backdrop should be visible all the time bottom sheet is open
					disappearsOnIndex={-1}
					opacity={colors.backdropOpacity}
				/>
			),
			[]
		);

		const bottomSheet = isTablet ? styles.bottomSheet : {};

		// Must need this prop to avoid keyboard dismiss
		// when is android tablet and the input text is focused
		const androidTablet: any = isTablet && !isIOS ? { android_keyboardInputMode: 'adjustResize' } : {};

		return (
			<>
				{children}
				{isVisible && (
					<BottomSheet
						ref={bottomSheetRef}
						// If data.options exist, we calculate snaps to be precise, otherwise we cal
						snapPoints={data.options?.length ? snaps : animatedSnapPoints}
						handleHeight={animatedHandleHeight}
						// We need undefined to enable vertical swipe gesture inside the bottom sheet like in reaction picker
						contentHeight={data.snaps?.length || data.options?.length ? undefined : animatedContentHeight}
						animationConfigs={ANIMATION_CONFIG}
						animateOnMount={true}
						backdropComponent={renderBackdrop}
						handleComponent={renderHandle}
						enablePanDownToClose
						style={{ ...styles.container, ...bottomSheet }}
						backgroundStyle={{ backgroundColor: colors.surfaceLight }}
						onChange={index => index === -1 && onClose()}
						// We need this to allow horizontal swipe gesture inside the bottom sheet like in reaction picker
						enableContentPanningGesture={data?.enableContentPanningGesture ?? true}
						{...androidTablet}>
						<BottomSheetContent
							options={data?.options}
							hide={hide}
							children={data?.children}
							hasCancel={data?.hasCancel}
							onLayout={handleContentLayout}
						/>
					</BottomSheet>
				)}
			</>
		);
	})
);

export default ActionSheet;
