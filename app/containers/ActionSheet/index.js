import React, {
	useRef,
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';
import Animated, {
	Extrapolate,
	interpolate,
	Value
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
	useDimensions,
	useBackHandler,
	useDeviceOrientation
} from '@react-native-community/hooks';

import Item from './Item';
import Handle from './Handle';
import Separator from '../Separator';
import { themes } from '../../constants/colors';
import styles, { ITEM_HEIGHT } from './styles';
import { isTablet, isAndroid } from '../../utils/deviceInfo';

const HANDLE_HEIGHT = 40;
const MIN_SNAP_HEIGHT = 16;

const ANIMATION_DURATION = 100;

const ANIMATION_CONFIG = {
	duration: ANIMATION_DURATION
};

/*
 * At Android height needs to be adjusted
 * because of the StyleSheet has a difference of
 * +2 dp between Android and iOS
 */
const ANDROID_ADJUST = isAndroid ? 2 : 0;

const ActionSheet = forwardRef(({ children, theme }, ref) => {
	const bottomSheetRef = useRef();
	const [data, setData] = useState({});
	const [visible, setVisible] = useState(false);
	const orientation = useDeviceOrientation();
	const { height } = useDimensions().window;
	const insets = useSafeAreaInsets();
	const { landscape } = orientation;

	const open = Math.max((height - ((ITEM_HEIGHT + ANDROID_ADJUST) * data?.options?.length) - HANDLE_HEIGHT - (data?.headerHeight || 0) - insets.bottom), MIN_SNAP_HEIGHT);

	/*
	 * if the action sheet cover more
	 * than 60% of the whole screen
	 * and it's not at the landscape mode
	 * we'll provide more one snap
	 * that point 50% of the whole screen
	*/
	const snaps = (height - open > height * 0.6) && !landscape ? [open, height * 0.5, height] : [open, height];
	const opened = snaps.length > 2 ? 1 : 0;
	const closed = snaps.length - 1;

	const toggleVisible = () => setVisible(!visible);

	const hide = () => {
		bottomSheetRef.current?.snapTo(closed);
	};

	const show = (options) => {
		setData(options);
		toggleVisible();
	};

	const overlay = ({ nativeEvent }) => {
		if (nativeEvent.oldState === State.ACTIVE) {
			hide();
		}
	};

	useBackHandler(() => {
		if (visible) {
			hide();
		}
		return visible;
	});

	useEffect(() => {
		if (visible) {
			Keyboard.dismiss();
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			bottomSheetRef.current?.snapTo(opened);
		}
	}, [visible]);

	/*
	 * For now we'll just hide the action sheet
	 * when orientation changes to/from landscape
	 */
	useEffect(() => {
		setVisible(false);
	}, [orientation.landscape]);

	useImperativeHandle(ref, () => ({
		show,
		hide
	}));

	const renderHandle = () => (
		<>
			<Handle theme={theme} />
			{data?.customHeader || null}
		</>
	);

	const renderSeparator = () => <Separator theme={theme} style={styles.separator} />;

	const animatedPosition = React.useRef(new Value(0));
	const opacity = interpolate(visible, {
		inputRange: [0, 0.7],
		outputRange: [0, 0.7],
		extrapolate: Extrapolate.CLAMP
	});

	return (
		<>
			{children}
			{visible && (
				<>
					<TapGestureHandler onHandlerStateChange={overlay}>
						<Animated.View
							testID='scroll-bottom-sheet-backdrop'
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
						testID='scroll-bottom-sheet'
						ref={bottomSheetRef}
						componentType='FlatList'
						snapPoints={snaps}
						initialSnapIndex={closed}
						renderHandle={renderHandle}
						onSettle={index => (index === closed) && toggleVisible()}
						animatedPosition={animatedPosition.current}
						containerStyle={[
							styles.container,
							{ backgroundColor: themes[theme].focusedBackground },
							(landscape || isTablet) && styles.bottomSheet
						]}
						animationConfig={ANIMATION_CONFIG}
						// FlatList props
						data={data?.options}
						keyExtractor={item => item.title}
						style={{ backgroundColor: themes[theme].focusedBackground }}
						contentContainerStyle={styles.content}
						ItemSeparatorComponent={renderSeparator}
						ListHeaderComponent={renderSeparator}
						renderItem={({ item }) => <Item item={item} hide={hide} theme={theme} />}
					/>
				</>
			)}
		</>
	);
});
ActionSheet.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
