import React, { forwardRef, isValidElement, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';
import Animated, { Easing, Extrapolate, Value, interpolateNode } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useBackHandler } from '@react-native-community/hooks';

import { Item } from './Item';
import { Handle } from './Handle';
import { Button } from './Button';
import { themes } from '../../constants/colors';
import styles, { ITEM_HEIGHT } from './styles';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import * as List from '../List';
import I18n from '../../i18n';
import { IDimensionsContextProps, useDimensions, useOrientation } from '../../dimensions';

interface IActionSheetData {
	options: any;
	headerHeight?: number;
	hasCancel?: boolean;
	customHeader: any;
}

const getItemLayout = (data: any, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index });

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
	forwardRef(({ children, theme }: { children: JSX.Element; theme: string }, ref) => {
		const bottomSheetRef: any = useRef();
		const [data, setData] = useState<IActionSheetData>({} as IActionSheetData);
		const [isVisible, setVisible] = useState(false);
		const { height }: Partial<IDimensionsContextProps> = useDimensions();
		const { isLandscape } = useOrientation();
		const insets = useSafeAreaInsets();

		const maxSnap = Math.max(
			height! -
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
		const snaps: any = height! - maxSnap > height! * 0.6 && !isLandscape ? [maxSnap, height! * 0.5, height] : [maxSnap, height];
		const openedSnapIndex = snaps.length > 2 ? 1 : 0;
		const closedSnapIndex = snaps.length - 1;

		const toggleVisible = () => setVisible(!isVisible);

		const hide = () => {
			bottomSheetRef.current?.snapTo(closedSnapIndex);
		};

		const show = (options: any) => {
			setData(options);
			toggleVisible();
		};

		const onBackdropPressed = ({ nativeEvent }: any) => {
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
				<Handle theme={theme} />
				{isValidElement(data?.customHeader) ? data.customHeader : null}
			</>
		);

		const renderFooter = () =>
			data?.hasCancel ? (
				<Button onPress={hide} style={[styles.button, { backgroundColor: themes[theme].auxiliaryBackground }]} theme={theme}>
					<Text style={[styles.text, { color: themes[theme].bodyText }]}>{I18n.t('Cancel')}</Text>
				</Button>
			) : null;

		const renderItem = ({ item }: any) => <Item item={item} hide={hide} theme={theme} />;

		const animatedPosition = React.useRef(new Value(0));
		// TODO: Similar to https://github.com/wcandillon/react-native-redash/issues/307#issuecomment-827442320
		const opacity = interpolateNode(animatedPosition.current, {
			inputRange: [0, 1],
			outputRange: [0, themes[theme].backdropOpacity],
			extrapolate: Extrapolate.CLAMP
		}) as any;

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
						<ScrollBottomSheet
							testID='action-sheet'
							ref={bottomSheetRef}
							componentType='FlatList'
							snapPoints={snaps}
							initialSnapIndex={closedSnapIndex}
							renderHandle={renderHandle}
							onSettle={index => index === closedSnapIndex && toggleVisible()}
							animatedPosition={animatedPosition.current}
							containerStyle={
								[
									styles.container,
									{ backgroundColor: themes[theme].focusedBackground },
									(isLandscape || isTablet) && styles.bottomSheet
								] as any
							}
							animationConfig={ANIMATION_CONFIG}
							// FlatList props
							data={data?.options}
							renderItem={renderItem}
							keyExtractor={(item: any) => item.title}
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
