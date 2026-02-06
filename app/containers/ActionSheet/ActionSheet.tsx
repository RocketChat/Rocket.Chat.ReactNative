import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, useWindowDimensions } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { isTablet } from '../../lib/methods/helpers';
import { Handle } from './Handle';
import { type TActionSheetOptions } from './Provider';
import BottomSheetContent from './BottomSheetContent';
import styles from './styles';

export const ACTION_SHEET_ANIMATION_DURATION = 250;

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { colors } = useTheme();
		const { height: windowHeight } = useWindowDimensions();
		const { right, left } = useSafeAreaInsets();
		const sheetRef = useRef<TrueSheet>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setVisible] = useState(false);

		const hide = () => {
			sheetRef.current?.dismiss();
		};

		const show = (options: TActionSheetOptions) => {
			setData(options);
			setVisible(true);
			sheetRef.current?.present(0);
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
			<>
				<Handle />
				{isValidElement(data?.customHeader) ? data.customHeader : null}
			</>
		);

		const onDidDismiss = () => {
			setVisible(false);
			data?.onClose?.();
		};

		const bottomSheetStyle = isTablet ? styles.bottomSheet : { marginRight: right, marginLeft: left };

		return (
			<>
				{children}
				<TrueSheet
					ref={sheetRef}
					detents={['auto']}
					maxHeight={windowHeight * 0.8}
					backgroundColor={colors.surfaceLight}
					cornerRadius={16}
					dimmed
					grabber={false}
					header={renderHeader()}
					scrollable={!!data?.options}
					style={[styles.container, bottomSheetStyle]}
					onDidDismiss={onDidDismiss}>
					<BottomSheetContent
						options={data?.options}
						hide={hide}
						children={data?.children}
						hasCancel={data?.hasCancel}
						onLayout={() => {}}
					/>
				</TrueSheet>
			</>
		);
	})
);

export default ActionSheet;
