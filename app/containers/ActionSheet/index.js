import React, {
	useRef,
	useState,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard, Dimensions } from 'react-native';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Header from './Header';
import Item from './Item';
import Shadow from './Shadow';

import Separator from '../Separator';
import { themes } from '../../constants/colors';
import styles from './styles';

const windowHeight = Dimensions.get('window').height;

const ActionSheet = React.memo(forwardRef(({ children, theme }, ref) => {
	const bottomSheetRef = useRef(null);
	const fall = new Animated.Value(0);
	const [title, setTitle] = useState();
	const [header, setHeader] = useState();
	const [content, setContent] = useState([]);
	const [onPress, setOnPress] = useState();

	const hideActionSheet = () => {
		setContent([]);
		bottomSheetRef.current?.snapTo(2);
	};

	const showActionSheetWithOptions = ({ options, header: customHeader, title: headerTitle }, callback) => {
		Keyboard.dismiss();
		setHeader(customHeader);
		setTitle(headerTitle);
		setContent(options);
		setOnPress(() => (idx) => {
			callback(idx);
			setContent([]);
		});
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		bottomSheetRef.current?.snapTo(1);
	};

	useImperativeHandle(ref, () => ({
		showActionSheetWithOptions,
		hideActionSheet
	}));

	const renderHeader = () => (
		<Header
			title={title}
			header={header}
			theme={theme}
		/>
	);

	return (
		<>
			{children}
			<Shadow
				fall={fall}
				theme={theme}
			/>
			<ScrollBottomSheet
				ref={bottomSheetRef}
				componentType='FlatList'
				snapPoints={[128, '50%', windowHeight]}
				initialSnapIndex={2}
				renderHandle={renderHeader}
				animatedPosition={fall}
				data={content}
				renderItem={({ item, index }) => <Item item={item} onPress={() => onPress(index)} theme={theme} />}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={styles.content}
				ListHeaderComponent={() => <Separator theme={theme} />}
				onSettle={index => index === 2 && console.log('fechou')}
				ItemSeparatorComponent={() => <Separator theme={theme} />}
			/>
		</>
	);
}));
ActionSheet.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
