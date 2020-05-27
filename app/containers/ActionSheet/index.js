import React, {
	useRef,
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard } from 'react-native';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';
import Animated, {
	Easing,
	Extrapolate,
	interpolate,
	Value
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Item from './Item';
import Handle from './Handle';
import Separator from '../Separator';
import { themes } from '../../constants/colors';
import styles, { ITEM_HEIGHT } from './styles';
import useOrientation from '../../utils/useOrientation';
import useDimensions from '../../utils/useDimensions';
import { isTablet, isAndroid } from '../../utils/deviceInfo';

const HANDLE_HEIGHT = 40;
const MIN_SNAP_HEIGHT = 16;

const ANIMATION_DURATION = 150;

const ANIMATION_CONFIG = {
	duration: ANIMATION_DURATION,
	easing: Easing.out(Easing.elastic(0))
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
	const orientation = useOrientation();
	const { height } = useDimensions();

	const open = Math.max((height - ((ITEM_HEIGHT + ANDROID_ADJUST) * data?.options?.length) - HANDLE_HEIGHT - (data?.headerHeight || 0)), MIN_SNAP_HEIGHT);

	/*
	 * if the action sheet cover more
	 * than 60% of the whole screen
	 * we'll provide more one snap
	 * that point 50% of the whole screen
	*/
	const snaps = height - open > height * 0.6 ? [open, '50%', height] : [open, height];
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

	useEffect(() => {
		if (visible) {
			Keyboard.dismiss();
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			bottomSheetRef.current?.snapTo(opened);
		}
	}, [visible]);

	useEffect(() => {
		// Open at the greatest possible snap
		bottomSheetRef.current?.snapTo(0);
	}, [orientation]);

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
	const opacity = interpolate(animatedPosition.current, {
		inputRange: [0, 1],
		outputRange: [0, 0.75],
		extrapolate: Extrapolate.CLAMP
	});

	return (
		<>
			{children}
			{visible && (
				<>
					<TapGestureHandler onHandlerStateChange={overlay}>
						<Animated.View
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
						key={orientation}
						ref={bottomSheetRef}
						componentType='FlatList'
						snapPoints={snaps}
						initialSnapIndex={closed}
						renderHandle={renderHandle}
						onSettle={index => (index === closed) && toggleVisible()}
						animatedPosition={animatedPosition.current}
						containerStyle={[
							styles.container,
							{ backgroundColor: themes[theme].backgroundColor },
							isTablet && styles.bottomSheet
						]}
						animationConfig={ANIMATION_CONFIG}
						// FlatList props
						data={data?.options}
						keyExtractor={item => item.title}
						style={{ backgroundColor: themes[theme].backgroundColor }}
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
