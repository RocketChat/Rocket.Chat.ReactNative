import React, {
	useRef,
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
	useCallback,
	isValidElement
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';
import Animated, {
	Extrapolate,
	interpolate,
	Value,
	Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useBackHandler } from '@react-native-community/hooks';

import { Item } from './Item';
import { Handle } from './Handle';
import { Button } from './Button';
import { themes } from '../../constants/colors';
import styles, { ITEM_HEIGHT } from './styles';
import { isTablet, isIOS } from '../../utils/deviceInfo';
import * as List from '../List';
import I18n from '../../i18n';
import { useOrientation, useDimensions } from '../../dimensions';

const getItemLayout = (data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index });

const HANDLE_HEIGHT = isIOS ? 40 : 56;
const MAX_SNAP_HEIGHT = 16;
const CANCEL_HEIGHT = 64;

const ANIMATION_DURATION = 250;

const ANIMATION_CONFIG = {
	duration: ANIMATION_DURATION,
	// https://easings.net/#easeInOutCubic
	easing: Easing.bezier(0.645, 0.045, 0.355, 1.0)
};

const ActionSheet = React.memo(forwardRef(({ children, theme }, ref) => {
	const bottomSheetRef = useRef();
	const [data, setData] = useState({});
	const [isVisible, setVisible] = useState(false);
	const { height } = useDimensions();
	const { isLandscape } = useOrientation();
	const insets = useSafeAreaInsets();

	const maxSnap = Math.max(
		(
			height
			// Items height
			- (ITEM_HEIGHT * (data?.options?.length || 0))
			// Handle height
			- HANDLE_HEIGHT
			// Custom header height
			- (data?.headerHeight || 0)
			// Insets bottom height (Notch devices)
			- insets.bottom
			// Cancel button height
			- (data?.hasCancel ? CANCEL_HEIGHT : 0)
		),
		MAX_SNAP_HEIGHT
	);

	/*
	 * if the action sheet cover more
	 * than 60% of the whole screen
	 * and it's not at the landscape mode
	 * we'll provide more one snap
	 * that point 50% of the whole screen
	*/
	const snaps = (height - maxSnap > height * 0.6) && !isLandscape ? [maxSnap, height * 0.5, height] : [maxSnap, height];
	const openedSnapIndex = snaps.length > 2 ? 1 : 0;
	const closedSnapIndex = snaps.length - 1;

	const toggleVisible = () => setVisible(!isVisible);

	const hide = () => {
		bottomSheetRef.current?.snapTo(closedSnapIndex);
	};

	const show = (options) => {
		setData(options);
		toggleVisible();
	};

	const onBackdropPressed = ({ nativeEvent }) => {
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

	const renderHandle = useCallback(() => (
		<>
			<Handle theme={theme} />
			{isValidElement(data?.customHeader) ? data.customHeader : null}
		</>
	));

	const renderFooter = useCallback(() => (data?.hasCancel ? (
		<Button
			onPress={hide}
			style={[styles.button, { backgroundColor: themes[theme].auxiliaryBackground }]}
			theme={theme}
		>
			<Text style={[styles.text, { color: themes[theme].bodyText }]}>
				{I18n.t('Cancel')}
			</Text>
		</Button>
	) : null));

	const renderItem = useCallback(({ item }) => <Item item={item} hide={hide} theme={theme} />);

	const animatedPosition = React.useRef(new Value(0));
	const opacity = interpolate(animatedPosition.current, {
		inputRange: [0, 1],
		outputRange: [0, themes[theme].backdropOpacity],
		extrapolate: Extrapolate.CLAMP
	});

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
						onSettle={index => (index === closedSnapIndex) && toggleVisible()}
						animatedPosition={animatedPosition.current}
						containerStyle={[
							styles.container,
							{ backgroundColor: themes[theme].focusedBackground },
							(isLandscape || isTablet) && styles.bottomSheet
						]}
						animationConfig={ANIMATION_CONFIG}
						// FlatList props
						data={data?.options}
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
}));
ActionSheet.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
