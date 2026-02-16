import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, Pressable, type LayoutChangeEvent } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import I18n from '../../i18n';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useTheme } from '../../theme';
import { Handle } from './Handle';
import { type TActionSheetOptions } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import styles from './styles';
import { ACTION_SHEET_MAX_HEIGHT_FRACTION } from './utils';
import { useActionSheetDetents } from './useActionSheetDetents';

export const ACTION_SHEET_ANIMATION_DURATION = 250;

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { colors } = useTheme();
		const { height: windowHeight, fontScale } = useResponsiveLayout();
		const { bottom, right, left } = useSafeAreaInsets();
		const sheetRef = useRef<TrueSheet>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setVisible] = useState(false);
		const [contentHeight, setContentHeight] = useState(0);

		const itemHeight = 48 * fontScale;

		const detents = useActionSheetDetents({
			data,
			windowHeight,
			contentHeight,
			itemHeight,
			bottom
		});

		const handleContentLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
			setContentHeight(layout.height);
		}, []);

		const hide = () => {
			sheetRef.current?.dismiss();
		};

		const show = (options: TActionSheetOptions) => {
			setData(options);
			setVisible(true);
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
				sheetRef.current?.present(0);
			}
		}, [isVisible]);

		useImperativeHandle(ref, () => ({
			showActionSheet: show,
			hideActionSheet: hide
		}));

		// We should not use Touch component because it breaks the action sheet height.
		const renderHandle = () => (
			<>
				<Pressable onPress={hide} accessible accessibilityRole='button' accessibilityLabel={I18n.t('Hide_action_sheet')}>
					<Handle />
				</Pressable>
				{isValidElement(data?.customHeader) ? data.customHeader : null}
			</>
		);

		const onDidDismiss = () => {
			setVisible(false);
			setContentHeight(0);
			data?.onClose?.();
		};

		const bottomSheetStyle = { marginRight: right, marginLeft: left };

		return (
			<>
				{children}
				<TrueSheet
					ref={sheetRef}
					detents={detents}
					maxHeight={windowHeight * ACTION_SHEET_MAX_HEIGHT_FRACTION}
					backgroundColor={colors.surfaceLight}
					cornerRadius={16}
					dimmed
					grabber={false}
					header={renderHandle()}
					scrollable={!!data?.options}
					style={[styles.container, bottomSheetStyle]}
					onDidDismiss={onDidDismiss}>
					<BottomSheetContent
						options={data?.options}
						hide={hide}
						children={data?.children}
						hasCancel={data?.hasCancel}
						onLayout={handleContentLayout}
					/>
				</TrueSheet>
			</>
		);
	})
);

export default ActionSheet;
