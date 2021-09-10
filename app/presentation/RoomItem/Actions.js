import React from 'react';
import { Animated, View, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import PropTypes from 'prop-types';

import I18n, { isRTL } from '../../i18n';
import styles, { ACTION_WIDTH, LONG_SWIPE, ROW_HEIGHT_CONDENSED } from './styles';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import { DISPLAY_MODE_CONDENSED } from '../../constants/constantDisplayMode';

const reverse = new Animated.Value(isRTL() ? -1 : 1);

export const LeftActions = React.memo(({
	theme, transX, isRead, width, onToggleReadPress, displayMode
}) => {
	const translateX = Animated.multiply(
		transX.interpolate({
			inputRange: [0, ACTION_WIDTH],
			outputRange: [-ACTION_WIDTH, 0]
		}),
		reverse
	);

	const viewHeight = displayMode === DISPLAY_MODE_CONDENSED ? { height: ROW_HEIGHT_CONDENSED } : null;

	return (
		<View
			style={[styles.actionsContainer]}
			pointerEvents='box-none'
		>
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{
						right: width - ACTION_WIDTH,
						width,
						transform: [{ translateX }],
						backgroundColor: themes[theme].tintColor
					},
					viewHeight
				]}
			>
				<View style={[styles.actionLeftButtonContainer, viewHeight]}>
					<RectButton style={styles.actionButton} onPress={onToggleReadPress}>
						<>
							<CustomIcon size={20} name={isRead ? 'flag' : 'check'} color='white' />
							<Text style={[styles.actionText, { color: themes[theme].buttonText }]}>{I18n.t(isRead ? 'Unread' : 'Read')}</Text>
						</>
					</RectButton>
				</View>
			</Animated.View>
		</View>
	);
});

export const RightActions = React.memo(({
	transX, favorite, width, toggleFav, onHidePress, theme, displayMode
}) => {
	const translateXFav = Animated.multiply(
		transX.interpolate({
			inputRange: [-width / 2, -ACTION_WIDTH * 2, 0],
			outputRange: [width / 2, width - ACTION_WIDTH * 2, width]
		}),
		reverse
	);
	const translateXHide = Animated.multiply(
		transX.interpolate({
			inputRange: [-width, -LONG_SWIPE, -ACTION_WIDTH * 2, 0],
			outputRange: [0, width - LONG_SWIPE, width - ACTION_WIDTH, width]
		}),
		reverse
	);

	const viewHeight = displayMode === DISPLAY_MODE_CONDENSED ? { height: ROW_HEIGHT_CONDENSED } : null;

	return (
		<View
			style={[styles.actionsLeftContainer, viewHeight]}
			pointerEvents='box-none'
		>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width,
						transform: [{ translateX: translateXFav }],
						backgroundColor: themes[theme].hideBackground
					},
					viewHeight
				]}
			>
				<RectButton style={[styles.actionButton, { backgroundColor: themes[theme].favoriteBackground }]} onPress={toggleFav}>
					<>
						<CustomIcon size={20} name={favorite ? 'star-filled' : 'star'} color={themes[theme].buttonText} />
						<Text style={[styles.actionText, { color: themes[theme].buttonText }]}>{I18n.t(favorite ? 'Unfavorite' : 'Favorite')}</Text>
					</>
				</RectButton>
			</Animated.View>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width,
						transform: [{ translateX: translateXHide }]
					},
					(displayMode === DISPLAY_MODE_CONDENSED && { height: ROW_HEIGHT_CONDENSED })
				]}
			>
				<RectButton style={[styles.actionButton, { backgroundColor: themes[theme].hideBackground }]} onPress={onHidePress}>
					<>
						<CustomIcon size={20} name='unread-on-top-disabled' color={themes[theme].buttonText} />
						<Text style={[styles.actionText, { color: themes[theme].buttonText }]}>{I18n.t('Hide')}</Text>
					</>
				</RectButton>
			</Animated.View>
		</View>
	);
});

LeftActions.propTypes = {
	theme: PropTypes.string,
	transX: PropTypes.object,
	isRead: PropTypes.bool,
	width: PropTypes.number,
	onToggleReadPress: PropTypes.func,
	displayMode: PropTypes.string
};

RightActions.propTypes = {
	theme: PropTypes.string,
	transX: PropTypes.object,
	favorite: PropTypes.bool,
	width: PropTypes.number,
	toggleFav: PropTypes.func,
	onHidePress: PropTypes.func,
	displayMode: PropTypes.string
};
