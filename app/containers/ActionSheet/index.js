import React, {
	useRef,
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard, Dimensions } from 'react-native';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';
import Animated, {
	Extrapolate,
	interpolate,
	Value
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Item from './Item';

import Separator from '../Separator';
import { themes } from '../../constants/colors';
import styles from './styles';
import Header from './Header';
import Footer from './Footer';
import Handle from './Handle';
import useOrientation from '../../utils/useOrientation';

const windowHeight = Dimensions.get('window').height;

const ActionSheet = forwardRef(({ children, theme }, ref) => {
	const modalizeRef = useRef();
	const [data, setData] = useState({});
	const [visible, setVisible] = useState(false);
	const orientation = useOrientation();

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
		hide();
	}, [orientation]);

	useImperativeHandle(ref, () => ({
		show,
		hide
	}));

	const renderFooter = () => (data?.hasCancel ? (
		<Footer
			hide={hide}
			theme={theme}
		/>
	) : null);

	const renderHeader = () => (data?.title ? (
		<Header
			title={data?.title}
			theme={theme}
		/>
	) : null);

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
						ref={modalizeRef}
						componentType='FlatList'
						snapPoints={[128, windowHeight]}
						initialSnapIndex={1}
						renderHandle={renderHandle}
						data={data?.options}
						style={{ backgroundColor: themes[theme].backgroundColor }}
						contentContainerStyle={styles.content}
						ListHeaderComponent={renderHeader}
						ListFooterComponent={renderFooter}
						ItemSeparatorComponent={() => <Separator theme={theme} />}
						renderItem={({ item }) => <Item item={item} hide={hide} theme={theme} />}
						onSettle={index => index === 1 && toggleVisible()}
						animatedPosition={animatedPosition.current}
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
