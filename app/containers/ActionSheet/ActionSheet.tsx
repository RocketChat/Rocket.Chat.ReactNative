import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { Keyboard, useWindowDimensions } from 'react-native';
import { Easing, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import { useTheme } from '../../theme';
import { isIOS, isTablet } from '../../lib/methods/helpers';
import { Handle } from './Handle';
import { TActionSheetOptions } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import styles from './styles';

export const ACTION_SHEET_ANIMATION_DURATION = 250;

const ANIMATION_CONFIG = {
	duration: ACTION_SHEET_ANIMATION_DURATION,
	// https://easings.net/#easeInOutCubic
	easing: Easing.bezier(0.645, 0.045, 0.355, 1.0)
};

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { colors } = useTheme();
		const bottomSheetRef = useRef<BottomSheet>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setVisible] = useState(false);
		const { width, height } = useWindowDimensions();
		const isLandscape = width > height;
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
			}) => {
				animatedContentHeight.value = height;
			},
			[animatedContentHeight]
		);

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

		// Hides action sheet when orientation changes
		useEffect(() => {
			setVisible(false);
		}, [isLandscape]);

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
		};

		const renderBackdrop = useCallback(
			props => (
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

		const bottomSheet = isLandscape || isTablet ? styles.bottomSheet : {};

		// Must need this prop to avoid keyboard dismiss
		// when is android tablet and the input text is focused
		const androidTablet: any = isTablet && isLandscape && !isIOS ? { android_keyboardInputMode: 'adjustResize' } : {};

		return (
			<>
				{children}
				{isVisible && (
					<BottomSheet
						ref={bottomSheetRef}
						snapPoints={animatedSnapPoints}
						handleHeight={animatedHandleHeight}
						// We need undefined to enable vertical swipe gesture inside the bottom sheet like in reaction picker
						contentHeight={data.snaps?.length ? undefined : animatedContentHeight}
						animationConfigs={ANIMATION_CONFIG}
						animateOnMount={true}
						backdropComponent={renderBackdrop}
						handleComponent={renderHandle}
						enablePanDownToClose
						style={{ ...styles.container, ...bottomSheet }}
						backgroundStyle={{ backgroundColor: colors.focusedBackground }}
						onChange={index => index === -1 && onClose()}
						// We need this to allow horizontal swipe gesture inside the bottom sheet like in reaction picker
						enableContentPanningGesture={data?.enableContentPanningGesture ?? true}
						{...androidTablet}
					>
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
