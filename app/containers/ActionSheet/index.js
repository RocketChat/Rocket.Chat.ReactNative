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
import { useSplit } from '../../split';

const HANDLE_HEIGHT = 40;
const MIN_SNAP_HEIGHT = 56;

const ActionSheet = forwardRef(({ children, theme }, ref) => {
	const modalizeRef = useRef();
	const [data, setData] = useState({});
	const [visible, setVisible] = useState(false);
	const orientation = useOrientation();
	const { height } = useDimensions();
	const split = useSplit();

	const toggleVisible = () => setVisible(!visible);

	const hide = () => {
		modalizeRef.current?.snapTo(1);
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
			modalizeRef.current?.snapTo(0);
		}
	}, [visible]);

	useEffect(() => {
		modalizeRef.current?.snapTo(0);
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

	const animatedPosition = React.useRef(new Value(0));
	const opacity = interpolate(animatedPosition.current, {
		inputRange: [0, 1],
		outputRange: [0, 0.75],
		extrapolate: Extrapolate.CLAMP
	});

	const open = Math.max((height - (ITEM_HEIGHT * data?.options?.length) - HANDLE_HEIGHT - (data?.headerHeight || 0)), MIN_SNAP_HEIGHT);

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
						ref={modalizeRef}
						componentType='FlatList'
						snapPoints={[open, height]}
						initialSnapIndex={1}
						renderHandle={renderHandle}
						data={data?.options}
						style={{ backgroundColor: themes[theme].backgroundColor }}
						contentContainerStyle={styles.content}
						ItemSeparatorComponent={() => <Separator theme={theme} />}
						ListHeaderComponent={() => <Separator theme={theme} />}
						renderItem={({ item }) => <Item item={item} hide={hide} theme={theme} />}
						onSettle={index => index === 1 && toggleVisible()}
						animatedPosition={animatedPosition.current}
						containerStyle={split && styles.bottomSheet}
						nestedScrollEnabled
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
