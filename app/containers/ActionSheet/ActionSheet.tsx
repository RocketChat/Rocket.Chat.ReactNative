import { useBackHandler } from '@react-native-community/hooks';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, isValidElement, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, Text } from 'react-native';
import { HandlerStateChangeEventPayload, State, TapGestureHandler } from 'react-native-gesture-handler';
import Animated, { Easing, Extrapolate, interpolateNode, Value } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';

import { themes } from '../../constants/colors';
import { useDimensions, useOrientation } from '../../dimensions';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import * as List from '../List';
import { Button } from './Button';
import { Handle } from './Handle';
import { IActionSheetItem, Item } from './Item';
import { TActionSheetOptions, TActionSheetOptionsItem } from './Provider';
import styles, { ITEM_HEIGHT } from './styles';

const getItemLayout = (data: TActionSheetOptionsItem[] | null | undefined, index: number) => ({
	length: ITEM_HEIGHT,
	offset: ITEM_HEIGHT * index,
	index
});

const HANDLE_HEIGHT = isIOS ? 40 : 56;
const MAX_SNAP_HEIGHT = 16;
const CANCEL_HEIGHT = 64;

const ANIMATION_DURATION = 250;

const ANIMATION_CONFIG = {
	duration: ANIMATION_DURATION,
	// https://easings.net/#easeInOutCubic
	easing: Easing.bezier(0.645, 0.045, 0.355, 1.0)
};

const ActionSheet = React.memo(
	forwardRef(({ children }: { children: React.ReactElement }, ref) => {
		const { theme } = useTheme();
		const bottomSheetRef = useRef<ScrollBottomSheet<TActionSheetOptionsItem>>(null);
		const [data, setData] = useState<TActionSheetOptions>({} as TActionSheetOptions);
		const [isVisible, setVisible] = useState(false);
		const { height } = useDimensions();
		const { isLandscape } = useOrientation();
		const insets = useSafeAreaInsets();

		const maxSnap = Math.max(
			height -
				// Items height
				ITEM_HEIGHT * (data?.options?.length || 0) -
				// Handle height
				HANDLE_HEIGHT -
				// Custom header height
				(data?.headerHeight || 0) -
				// Insets bottom height (Notch devices)
				insets.bottom -
				// Cancel button height
				(data?.hasCancel ? CANCEL_HEIGHT : 0),
			MAX_SNAP_HEIGHT
		);

		/*
		 * if the action sheet cover more
		 * than 60% of the whole screen
		 * and it's not at the landscape mode
		 * we'll provide more one snap
		 * that point 50% of the whole screen
		 */
		const snaps = height - maxSnap > height * 0.6 && !isLandscape ? [maxSnap, height * 0.5, height] : [maxSnap, height];
		const openedSnapIndex = snaps.length > 2 ? 1 : 0;
		const closedSnapIndex = snaps.length - 1;

		const toggleVisible = () => setVisible(!isVisible);

		const hide = () => {
			bottomSheetRef.current?.snapTo(closedSnapIndex);
		};

		const show = (options: TActionSheetOptions) => {
			setData(options);
			toggleVisible();
		};

		const onBackdropPressed = ({ nativeEvent }: { nativeEvent: HandlerStateChangeEventPayload }) => {
			if (nativeEvent.oldState === State.ACTIVE) {
				hide();
			}
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
				bottomSheetRef.current?.snapTo(openedSnapIndex);
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

		const renderFooter = () =>
			data?.hasCancel ? (
				<Button
					onPress={hide}
					style={[styles.button, { backgroundColor: themes[theme].auxiliaryBackground }]}
					// TODO: Remove when migrate Touch
					theme={theme}
					accessibilityLabel={I18n.t('Cancel')}>
					<Text style={[styles.text, { color: themes[theme].bodyText }]}>{I18n.t('Cancel')}</Text>
				</Button>
			) : null;

		const renderItem = ({ item }: { item: IActionSheetItem['item'] }) => <Item item={item} hide={hide} />;

		const animatedPosition = React.useRef(new Value(0));
		const opacity = interpolateNode(animatedPosition.current, {
			inputRange: [0, 1],
			outputRange: [0, themes[theme].backdropOpacity],
			extrapolate: Extrapolate.CLAMP
		}) as any; // The function's return differs from the expected type of opacity, however this problem is something related to lib, maybe when updating the types will be fixed.

		const bottomSheet = isLandscape || isTablet ? styles.bottomSheet : {};

		return (
			<>
				{children}
				{isVisible && (
					<>
						<TapGestureHandler onHandlerStateChange={onBackdropPressed}>
							<Animated.View
								testID='action-sheet-backdrop'
								style={[
									styles.backdrop,
									{
										backgroundColor: themes[theme].backdropColor,
										opacity
									}
								]}
							/>
						</TapGestureHandler>
						<ScrollBottomSheet<TActionSheetOptionsItem>
							testID='action-sheet'
							ref={bottomSheetRef}
							componentType='FlatList'
							snapPoints={snaps}
							initialSnapIndex={closedSnapIndex}
							renderHandle={renderHandle}
							onSettle={index => index === closedSnapIndex && toggleVisible()}
							animatedPosition={animatedPosition.current}
							containerStyle={{ ...styles.container, ...bottomSheet, backgroundColor: themes[theme].focusedBackground }}
							animationConfig={ANIMATION_CONFIG}
							data={data.options}
							renderItem={renderItem}
							keyExtractor={item => item.title}
							style={{ backgroundColor: themes[theme].focusedBackground }}
							contentContainerStyle={styles.content}
							ItemSeparatorComponent={List.Separator}
							ListHeaderComponent={List.Separator}
							ListFooterComponent={renderFooter}
							getItemLayout={getItemLayout}
							removeClippedSubviews={isIOS}
						/>
					</>
				)}
			</>
		);
	})
);

export default ActionSheet;
