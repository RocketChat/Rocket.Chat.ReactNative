import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, Platform, useWindowDimensions } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../theme';
import { isAndroid, isIOS } from '../../lib/methods/helpers';
import { Handle } from './Handle';
import { type TActionSheetOptions, type TActionSheetOptionsItem } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import { HANDLE_HEIGHT, useActionSheetDetents } from './useActionSheetDetents';
import styles from './styles';

export const ACTION_SHEET_ANIMATION_DURATION = 250;

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { colors } = useTheme();
		const { height: windowHeight, width: windowWidth, fontScale } = useWindowDimensions();
		const sheetRef = useRef<TrueSheet>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setIsVisible] = useState(false);
		const [contentHeight, setContentHeight] = useState(0);
		const onCloseSnapshotRef = useRef<TActionSheetOptions['onClose']>(undefined);
		const itemOnCloseSnapshotRef = useRef<TActionSheetOptionsItem['onClose']>(undefined);

		// TrueSheet detects the bottom inset for Android 16 and iOS
		// To avoid content hiding behind navigation bar on older Android versions
		const isNewAndroid = isAndroid && Number(Platform.Version) >= 36;
		const bottom = isIOS || isNewAndroid ? 0 : windowHeight * 0.03;
		const itemHeight = 48 * fontScale;

		const handleContentLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
			setContentHeight(layout.height);
		};

		const hide = (itemOnClose?: TActionSheetOptionsItem['onClose']) => {
			itemOnCloseSnapshotRef.current = itemOnClose;
			sheetRef.current?.dismiss();
			Keyboard.dismiss();
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		};

		const show = (options: TActionSheetOptions) => {
			setData(options);
			setIsVisible(true);
			Keyboard.dismiss();
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onCloseSnapshotRef.current = options.onClose;
			sheetRef.current?.present();
		};

		useBackHandler(() => {
			if (isVisible) {
				hide();
			}
			return isVisible;
		});

		useImperativeHandle(ref, () => ({
			showActionSheet: show,
			hideActionSheet: hide
		}));

		const renderHeader = () => (
			<GestureHandlerRootView style={{ flex: 0 }}>
				<Handle onPress={hide} />
				{isValidElement(data?.customHeader) ? data.customHeader : null}
			</GestureHandlerRootView>
		);

		const onDidDismiss = () => {
			setIsVisible(false);
			// Keep contentHeight to avoid flickering on next show
			const snapshotOnClose = onCloseSnapshotRef.current;
			const snapshotItemOnClose = itemOnCloseSnapshotRef.current;
			onCloseSnapshotRef.current = undefined;
			itemOnCloseSnapshotRef.current = undefined;
			snapshotOnClose?.();
			snapshotItemOnClose?.();
		};

		const isPortrait = windowHeight > windowWidth;
		const effectiveSnaps = (isPortrait ? data?.portraitSnaps : data?.landscapeSnaps) || data?.snaps;

		const { detents, maxHeight, scrollEnabled } = useActionSheetDetents({
			windowHeight,
			bottomInset: bottom,
			itemHeight,
			optionsLength: data?.options?.length || 0,
			snaps: effectiveSnaps,
			headerHeight: data?.headerHeight,
			hasCancel: data?.hasCancel,
			contentHeight
		});

		const hasOptions = !!data?.options?.length;
		const hasSnaps = !!effectiveSnaps?.length;
		const disableContentPanning = data?.enableContentPanningGesture === false || (!scrollEnabled && isAndroid);
		const isScrollable = hasOptions || (hasSnaps && !disableContentPanning);

		const contentMinHeight =
			data.fullContainer && effectiveSnaps?.length
				? (() => {
						const snap = effectiveSnaps[0];
						const fraction = typeof snap === 'number' ? Math.min(1, Math.max(0.1, snap)) : (parseFloat(String(snap)) || 50) / 100;
						return Math.max(0, windowHeight * fraction - HANDLE_HEIGHT);
				  })()
				: undefined;

		return (
			<>
				{children}
				<TrueSheet
					ref={sheetRef}
					detents={detents}
					maxHeight={maxHeight}
					backgroundColor={colors.surfaceLight}
					cornerRadius={16}
					dimmed
					grabber={false}
					draggable={!disableContentPanning}
					header={renderHeader()}
					scrollable={isScrollable}
					style={styles.container}
					onDidDismiss={onDidDismiss}>
					<GestureHandlerRootView style={styles.contentContainer}>
						<BottomSheetContent
							options={data?.options}
							hide={hide}
							hasCancel={data?.hasCancel}
							onLayout={handleContentLayout}
							fullContainer={data.fullContainer}
							contentMinHeight={isIOS ? contentMinHeight : undefined}
							scrollEnabled={scrollEnabled}>
							{data?.children}
						</BottomSheetContent>
					</GestureHandlerRootView>
				</TrueSheet>
			</>
		);
	})
);

export default ActionSheet;
