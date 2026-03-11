import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../theme';
import { isIOS, isTablet } from '../../lib/methods/helpers';
import { Handle } from './Handle';
import { type TActionSheetOptions } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import { HANDLE_HEIGHT, useActionSheetDetents } from './useActionSheetDetents';
import styles from './styles';

export const ACTION_SHEET_ANIMATION_DURATION = 250;

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { colors } = useTheme();
		const { height: windowHeight, fontScale } = useWindowDimensions();
		const { bottom, right, left } = useSafeAreaInsets();
		const sheetRef = useRef<TrueSheet>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setIsVisible] = useState(false);
		const [contentHeight, setContentHeight] = useState(0);
		const presentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const onCloseSnapshotRef = useRef<TActionSheetOptions['onClose']>(undefined);

		const itemHeight = 48 * fontScale;

		const handleContentLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
			setContentHeight(layout.height);
		};

		const cancelPendingPresent = () => {
			if (presentTimerRef.current !== null) {
				clearTimeout(presentTimerRef.current);
				presentTimerRef.current = null;
			}
		};

		const hide = () => {
			cancelPendingPresent();
			onCloseSnapshotRef.current = data?.onClose;
			sheetRef.current?.dismiss();
			Keyboard.dismiss();
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		};

		const show = (options: TActionSheetOptions) => {
			cancelPendingPresent();
			setData(options);
			setIsVisible(true);
			Keyboard.dismiss();
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onCloseSnapshotRef.current = options.onClose;
			presentTimerRef.current = setTimeout(() => {
				presentTimerRef.current = null;
				sheetRef.current?.present();
			}, 200);
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
			setContentHeight(0);
			const snapshotOnClose = onCloseSnapshotRef.current;
			onCloseSnapshotRef.current = undefined;
			snapshotOnClose?.();
		};

		const bottomSheetStyle = isTablet ? styles.bottomSheet : { marginRight: right, marginLeft: left };

		const { detents, maxHeight } = useActionSheetDetents({
			windowHeight,
			bottomInset: bottom,
			itemHeight,
			optionsLength: data?.options?.length || 0,
			snaps: data?.snaps,
			headerHeight: data?.headerHeight,
			hasCancel: data?.hasCancel,
			contentHeight
		});

		const hasOptions = !!data?.options?.length;
		const hasSnaps = !!data?.snaps?.length;
		const disableContentPanning = data?.enableContentPanningGesture === false;
		const isScrollable = hasOptions || (hasSnaps && !disableContentPanning);

		const contentMinHeight =
			data.fullContainer && data.snaps?.length
				? (() => {
						const snap = data.snaps[0];
						const fraction = typeof snap === 'number' ? Math.min(1, Math.max(0.1, snap)) : (parseFloat(String(snap)) || 50) / 100;
						return Math.max(0, windowHeight * fraction - HANDLE_HEIGHT - bottom);
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
					style={[styles.container, bottomSheetStyle]}
					onDidDismiss={onDidDismiss}>
					<GestureHandlerRootView style={styles.contentContainer}>
						<BottomSheetContent
							options={data?.options}
							hide={hide}
							children={data?.children}
							hasCancel={data?.hasCancel}
							onLayout={handleContentLayout}
							fullContainer={data.fullContainer}
							contentMinHeight={isIOS ? contentMinHeight : undefined}
						/>
					</GestureHandlerRootView>
				</TrueSheet>
			</>
		);
	})
);

export default ActionSheet;
