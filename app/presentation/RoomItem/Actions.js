import React from 'react';
import { Animated, View, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import PropTypes from 'prop-types';

import I18n from '../../i18n';
import styles, { ACTION_WIDTH, LONG_SWIPE } from './styles';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';

export const LeftActions = React.memo(({
	theme, transX, isRead, width, onToggleReadPress
}) => {
	const translateX = transX.interpolate({
		inputRange: [0, ACTION_WIDTH],
		outputRange: [-ACTION_WIDTH, 0]
	});
	const translateXIcon = transX.interpolate({
		inputRange: [0, ACTION_WIDTH, LONG_SWIPE - 2, LONG_SWIPE],
		outputRange: [0, 0, -LONG_SWIPE + ACTION_WIDTH + 2, 0],
		extrapolate: 'clamp'
	});
	return (
		<View
			style={[styles.actionsContainer, styles.actionLeftContainer]}
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
					}
				]}
			>
				<Animated.View
					style={[
						styles.actionLeftButtonContainer,
						{
							right: 0,
							transform: [{ translateX: translateXIcon }]
						}
					]}
				>
					<RectButton style={styles.actionButton} onPress={onToggleReadPress}>
						<>
							<CustomIcon size={20} name={isRead ? 'flag' : 'check'} color='white' />
							<Text style={[styles.actionText, { color: themes[theme].buttonText }]}>{I18n.t(isRead ? 'Unread' : 'Read')}</Text>
						</>
					</RectButton>
				</Animated.View>
			</Animated.View>
		</View>
	);
});

export const RightActions = React.memo(({
	transX, favorite, width, toggleFav, onHidePress, theme
}) => {
	const translateXFav = transX.interpolate({
		inputRange: [-width / 2, -ACTION_WIDTH * 2, 0],
		outputRange: [width / 2, width - ACTION_WIDTH * 2, width]
	});
	const translateXHide = transX.interpolate({
		inputRange: [-width, -LONG_SWIPE, -ACTION_WIDTH * 2, 0],
		outputRange: [0, width - LONG_SWIPE, width - ACTION_WIDTH, width]
	});
	return (
		<View
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				height: 75,
				flexDirection: 'row'
			}}
			pointerEvents='box-none'
		>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width,
						transform: [{ translateX: translateXFav }],
						backgroundColor: themes[theme].hideBackground
					}
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
					}
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
	onToggleReadPress: PropTypes.func
};

RightActions.propTypes = {
	theme: PropTypes.string,
	transX: PropTypes.object,
	favorite: PropTypes.bool,
	width: PropTypes.number,
	toggleFav: PropTypes.func,
	onHidePress: PropTypes.func
};
