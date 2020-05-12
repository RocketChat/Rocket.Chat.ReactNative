import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
	View,
	Text,
	FlatList,
	StyleSheet
} from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import { RectButton } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import Separator from './Separator';
import sharedStyles from '../views/Styles';

import { themes } from '../constants/colors';
import { withTheme } from '../theme';
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
		ItemSeparatorComponent={() => <Separator theme={theme} />}
		scrollEnabled={false}
	/>
));
Content.propTypes = {
	options: PropTypes.array,
	theme: PropTypes.string
};

const ITEMS = ['discussion', 'omnichannel', 'discussion', 'omnichannel', 'discussion', 'omnichannel', 'add-reaction'];

const HeaderItem = React.memo(({ item, theme }) => (
	<RectButton style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<CustomIcon name={item} size={24} color={themes[theme].bodyText} />
	</RectButton>
));
HeaderItem.propTypes = {
	item: PropTypes.string,
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
			style={{ backgroundColor: themes[theme].backgroundColor }}
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

const ActionSheet = React.memo(({ options, theme }) => {
	const ref = useRef();
	const fall = new Animated.Value(1);

	return (
		<>
			<BottomSheet
				ref={ref}
				initialSnap={0}
				snapPoints={[options.length * ITEM_HEIGHT, 0]}
				renderHeader={() => <Header theme={theme} />}
				renderContent={() => <Content options={options} theme={theme} />}
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
});
ActionSheet.propTypes = {
	options: PropTypes.array,
	theme: PropTypes.string
};

export default withTheme(ActionSheet);
