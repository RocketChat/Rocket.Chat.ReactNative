import React, {
	useRef,
	useState,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import {
	View,
	Text,
	Keyboard,
	FlatList,
	StyleSheet
} from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import { RectButton } from 'react-native-gesture-handler';
import useDeepCompareEffect from 'use-deep-compare-effect';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Separator from './Separator';
import sharedStyles from '../views/Styles';

import { themes } from '../constants/colors';
import { CustomIcon } from '../lib/Icons';

const ITEM_HEIGHT = 44;

const styles = StyleSheet.create({
	item: {
		height: ITEM_HEIGHT,
		alignItems: 'center',
		flexDirection: 'row'
	},
	content: {
		paddingHorizontal: 16
	},
	title: {
		fontSize: 14,
		marginLeft: 16,
		...sharedStyles.textRegular
	},
	shadow: {
		...StyleSheet.absoluteFillObject
	},
	header: {
		width: '100%',
		height: 24,
		alignItems: 'center',
		justifyContent: 'center',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16
	},
	headerItem: {
		height: 36,
		width: 36,
		borderRadius: 18,
		marginHorizontal: 8,
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerList: {
		paddingBottom: 16
	},
	headerIcon: {
		fontSize: 20
	},
	headerIndicator: {
		width: 36,
		height: 4,
		borderRadius: 2
	}
});

const Item = React.memo(({ item, theme }) => (
	<RectButton style={[styles.item, { backgroundColor: themes[theme].backgroundColor }]}>
		<CustomIcon name='discussion' size={20} color={themes[theme].bodyText} />
		<Text
			numberOfLines={1}
			style={[styles.title, { color: themes[theme].bodyText }]}
		>
			{item}
		</Text>
	</RectButton>
));
Item.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string
};

const Content = React.memo(({ options, theme }) => (
	<FlatList
		data={options}
		renderItem={({ item }) => <Item item={item} theme={theme} />}
		style={{ backgroundColor: themes[theme].backgroundColor }}
		contentContainerStyle={styles.content}
		ListHeaderComponent={() => <Separator theme={theme} />}
		ItemSeparatorComponent={() => <Separator theme={theme} />}
		scrollEnabled={false}
	/>
));
Content.propTypes = {
	options: PropTypes.array,
	theme: PropTypes.string
};

const ITEMS = ['😊', '👏🏻', '👍', '😱', '😒', '😊'];

const HeaderItem = React.memo(({ item, theme }) => (
	<RectButton style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<Text style={styles.headerIcon}>{item}</Text>
	</RectButton>
));
HeaderItem.propTypes = {
	item: PropTypes.string,
	theme: PropTypes.string
};

const HeaderFooter = React.memo(({ theme }) => (
	<RectButton style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<CustomIcon name='add-reaction' size={24} color={themes[theme].bodyText} />
	</RectButton>
));
HeaderFooter.propTypes = {
	theme: PropTypes.string
};

const Header = React.memo(({ theme }) => (
	<>
		<View style={[styles.header, { backgroundColor: themes[theme].backgroundColor }]}>
			<View style={[styles.headerIndicator, { backgroundColor: themes[theme].auxiliaryText }]} />
		</View>
		<FlatList
			data={ITEMS}
			renderItem={({ item }) => <HeaderItem item={item} theme={theme} />}
			style={[styles.headerList, { backgroundColor: themes[theme].backgroundColor }]}
			ListFooterComponent={() => <HeaderFooter theme={theme} />}
			scrollEnabled={false}
			horizontal
		/>
	</>
));
Header.propTypes = {
	theme: PropTypes.string
};

const Shadow = React.memo(({ fall, theme }) => {
	const opacity = Animated.interpolate(fall, {
		inputRange: [0, 1],
		outputRange: [0.5, 0]
	});

	return (
		<Animated.View
			pointerEvents='none'
			style={[
				styles.shadow,
				{
					backgroundColor: themes[theme].backdropColor,
					opacity
				}
			]}
		/>
	);
});
Shadow.propTypes = {
	fall: PropTypes.number,
	theme: PropTypes.string
};

const ActionSheet = React.memo(forwardRef(({ children, theme }, ref) => {
	const bottomSheetRef = useRef();
	const fall = new Animated.Value(1);
	const [content, setContent] = useState([]);

	const showActionSheetWithOptions = ({ options }, callback) => {
		Keyboard.dismiss();
		setContent(options);
		console.log(callback);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	useImperativeHandle(ref, () => ({ showActionSheetWithOptions }));

	useDeepCompareEffect(() => {
		if (content.length) {
			bottomSheetRef.current.snapTo(300);
		} else {
			bottomSheetRef.current.snapTo(0);
		}
	}, [content]);

	return (
		<>
			{children}
			<BottomSheet
				ref={bottomSheetRef}
				initialSnap={0}
				snapPoints={[0, 250, content.length * ITEM_HEIGHT]}
				renderHeader={() => <Header theme={theme} />}
				renderContent={() => <Content options={content} theme={theme} />}
				enabledContentGestureInteraction={false}
				enabledManualSnapping={false}
				enabledInnerScrolling={false}
				overdragResistanceFactor={5}
				callbackNode={fall}
				borderRadius={10}
			/>
			<Shadow
				fall={fall}
				theme={theme}
			/>
		</>
	);
}));
ActionSheet.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
