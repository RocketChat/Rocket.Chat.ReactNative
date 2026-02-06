import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import type { SheetDetent } from '@lodev09/react-native-true-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { isTablet } from '../../lib/methods/helpers';
import { Handle } from './Handle';
import { type TActionSheetOptions } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import styles from './styles';

export const ACTION_SHEET_ANIMATION_DURATION = 250;
const ACTION_SHEET_MIN_HEIGHT_FRACTION = 0.35;
const ACTION_SHEET_MAX_HEIGHT_FRACTION = 0.75;
const HANDLE_HEIGHT = 28;
const CANCEL_HEIGHT = 64;

function normalizeSnapsToDetents(snaps: (string | number)[]): number[] {
	return snaps
		.slice(0, 3)
		.map(snap => {
			if (typeof snap === 'number') {
				if (snap <= 0 || snap > 1) return Math.min(1, Math.max(0.1, snap));
				return snap;
			}
			const match = String(snap).match(/^(\d+(?:\.\d+)?)\s*%$/);
			if (match) return Math.min(1, Math.max(0.1, Number(match[1]) / 100));
			return 0.5;
		})
		.sort((a, b) => a - b);
}

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { colors } = useTheme();
		const { height: windowHeight, fontScale } = useWindowDimensions();
		const { bottom, right, left } = useSafeAreaInsets();
		const sheetRef = useRef<TrueSheet>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setVisible] = useState(false);
		const [contentHeight, setContentHeight] = useState(0);

		const itemHeight = 48 * fontScale;

		const handleContentLayout = useCallback(
			({ nativeEvent: { layout } }: LayoutChangeEvent) => {
				const height = Math.min(layout.height, windowHeight * ACTION_SHEET_MAX_HEIGHT_FRACTION);
				setContentHeight(height);
			},
			[windowHeight]
		);

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
				sheetRef.current?.present(0);
			}
		}, [isVisible]);

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

		const onDidDismiss = () => {
			setVisible(false);
			setContentHeight(0);
			data?.onClose?.();
		};

		const bottomSheetStyle = isTablet ? styles.bottomSheet : { marginRight: right, marginLeft: left };

		const hasOptions = (data?.options?.length || 0) > 0;
		const maxSnap = hasOptions
			? Math.min(
					(itemHeight + 0.5) * (data?.options?.length || 0) +
						HANDLE_HEIGHT +
						(data?.headerHeight || 0) +
						bottom +
						(data?.hasCancel ? CANCEL_HEIGHT : 0),
					windowHeight * ACTION_SHEET_MAX_HEIGHT_FRACTION
			  )
			: 0;

		let detents: SheetDetent[];
		if (data?.snaps?.length) {
			detents = normalizeSnapsToDetents(data.snaps);
		} else if (hasOptions) {
			if (maxSnap > windowHeight * 0.6) {
				detents = [0.5, ACTION_SHEET_MAX_HEIGHT_FRACTION];
			} else {
				const fraction = Math.max(0.25, Math.min(maxSnap / windowHeight, ACTION_SHEET_MAX_HEIGHT_FRACTION));
				detents = [fraction];
			}
		} else if (contentHeight > 0) {
			const fraction = Math.min(contentHeight / windowHeight, ACTION_SHEET_MAX_HEIGHT_FRACTION);
			const contentDetent = Math.max(0.25, fraction);
			detents =
				contentDetent > ACTION_SHEET_MIN_HEIGHT_FRACTION ? [ACTION_SHEET_MIN_HEIGHT_FRACTION, contentDetent] : [contentDetent];
		} else {
			detents = [ACTION_SHEET_MIN_HEIGHT_FRACTION, 'auto'];
		}

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
