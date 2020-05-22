import React, {
	useRef,
	useState,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard, Dimensions } from 'react-native';
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

const windowHeight = Dimensions.get('window').height;

const ActionSheet = forwardRef(({ children, theme }, ref) => {
	const modalizeRef = useRef();
	const [data, setData] = useState({});
	const [visible, setVisible] = useState(false);

	const toggleVisible = () => setVisible(!visible);

	const hide = () => {
		modalizeRef.current?.snapTo(1);
		toggleVisible();
	};

	const show = (options) => {
		Keyboard.dismiss();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setData(options);
		modalizeRef.current?.snapTo(0);
		toggleVisible();
	};

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
	) : (data?.customHeader || null));

	const renderHandle = () => <Handle theme={theme} />;

	const animatedPosition = React.useRef(new Value(0));
	const opacity = interpolate(animatedPosition.current, {
		inputRange: [0, 1],
		outputRange: [0, 0.75],
		extrapolate: Extrapolate.CLAMP
	});

	return (
		<>
			{children}
			<Animated.View
				pointerEvents='box-none'
				style={[
					styles.backdrop,
					{
						backgroundColor: themes[theme].backdropColor,
						opacity
					}
				]}
			/>
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
	);
});
ActionSheet.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
