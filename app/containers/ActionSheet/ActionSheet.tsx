import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../theme';
import { isTablet } from '../../lib/methods/helpers';
import { Handle } from './Handle';
import { type TActionSheetOptions } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import { useActionSheetDetents } from './useActionSheetDetents';
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

		const itemHeight = 48 * fontScale;

		const handleContentLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
			setContentHeight(layout.height);
		};

		const hide = () => {
			sheetRef.current?.dismiss();
		};

		const show = (options: TActionSheetOptions) => {
			setData(options);
			setIsVisible(true);
			// timeout to open after the old one close;
			setTimeout(() => {
				sheetRef.current?.present();
			}, 200);
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

		const renderHeader = () => (
			<GestureHandlerRootView style={{ flex: 0 }}>
				<Handle onPress={hide} />
				{isValidElement(data?.customHeader) ? data.customHeader : null}
			</GestureHandlerRootView>
		);

		const onDidDismiss = () => {
			setIsVisible(false);
			setContentHeight(0);
			data?.onClose?.();
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
					header={renderHeader()}
					scrollable={!!data?.options}
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
						/>
					</GestureHandlerRootView>
				</TrueSheet>
			</>
		);
	})
);

export default ActionSheet;
