import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { Keyboard } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import { useDimensions, useOrientation } from '../../dimensions';
import { useTheme } from '../../theme';
import { isIOS, isTablet } from '../../lib/methods/helpers';
import { Handle } from './Handle';
import { TActionSheetOptions } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import styles, { ITEM_HEIGHT } from './styles';

const HANDLE_HEIGHT = isIOS ? 40 : 56;
const MIN_SNAP_HEIGHT = 16;
const CANCEL_HEIGHT = 64;

const ANIMATION_DURATION = 250;

const ANIMATION_CONFIG = {
	duration: ANIMATION_DURATION,
	// https://easings.net/#easeInOutCubic
	easing: Easing.bezier(0.645, 0.045, 0.355, 1.0)
};

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { colors } = useTheme();
		const bottomSheetRef = useRef<BottomSheet>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setVisible] = useState(false);
		const { height } = useDimensions();
		const { isLandscape } = useOrientation();
		const insets = useSafeAreaInsets();

		const maxSnap = Math.min(
			// Items height
			ITEM_HEIGHT * (data?.options?.length || 0) +
				// Handle height
				HANDLE_HEIGHT +
				// Custom header height
				(data?.headerHeight || 0) +
				// Insets bottom height (Notch devices)
				insets.bottom +
				// Cancel button height
				(data?.hasCancel ? CANCEL_HEIGHT : 0),
			height - MIN_SNAP_HEIGHT
		);

		/*
		 * if the action sheet cover more
		 * than 60% of the whole screen
		 * and it's not at the landscape mode
		 * we'll provide more one snap
		 * that point 50% of the whole screen
		 */
		const snaps = maxSnap > height * 0.6 && !isLandscape && !data.snaps ? [height * 0.5, maxSnap] : [maxSnap];

		const toggleVisible = () => setVisible(!isVisible);

		const hide = () => {
			bottomSheetRef.current?.close();
		};

		const show = (options: TActionSheetOptions) => {
			setData(options);
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

		return (
			<>
				{children}
				{isVisible && (
					<BottomSheet
						ref={bottomSheetRef}
						snapPoints={data?.snaps ? data.snaps : snaps}
						animationConfigs={ANIMATION_CONFIG}
						animateOnMount={true}
						backdropComponent={renderBackdrop}
						handleComponent={renderHandle}
						enablePanDownToClose
						style={{ ...styles.container, ...bottomSheet }}
						backgroundStyle={{ backgroundColor: colors.focusedBackground }}
						onChange={index => index === -1 && toggleVisible()}>
						<BottomSheetContent options={data?.options} hide={hide} children={data?.children} hasCancel={data?.hasCancel} />
					</BottomSheet>
				)}
			</>
		);
	})
);

export default ActionSheet;
