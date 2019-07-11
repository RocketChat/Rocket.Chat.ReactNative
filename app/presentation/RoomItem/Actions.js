import React from 'react';
import { Animated, View, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import I18n from '../../i18n';
import styles, { ACTION_WIDTH } from './styles';
import { CustomIcon } from '../../lib/Icons';

export const LeftActions = React.memo(({ rowTranslation, isRead, width, handleLeftButtonPress }) => {
	const halfWidth = width / 2;
	const trans = rowTranslation.interpolate({
		inputRange: [0, ACTION_WIDTH],
		outputRange: [-width, -width + ACTION_WIDTH]
	});

	const iconTrans = rowTranslation.interpolate({
		inputRange: [0, ACTION_WIDTH, halfWidth - 1, halfWidth, width],
		outputRange: [0, 0, -(ACTION_WIDTH + 10), 0, 0]
	});

	return (
		<Animated.View
			style={[
				styles.leftAction,
				{ transform: [{ translateX: trans }] }
			]}
		>
			<RectButton style={styles.actionButtonLeft} onPress={handleLeftButtonPress}>
				<Animated.View
					style={{ transform: [{ translateX: iconTrans }] }}
				>
					{isRead ? (
						<View style={styles.actionView}>
							<CustomIcon size={20} name='flag' color='white' />
							<Text style={styles.actionText}>{I18n.t('Unread')}</Text>
						</View>
					) : (
						<View style={styles.actionView}>
							<CustomIcon size={20} name='check' color='white' />
							<Text style={styles.actionText}>{I18n.t('Read')}</Text>
						</View>
					)}
				</Animated.View>
			</RectButton>
		</Animated.View>
	);
});

export const RightActions = React.memo(({ rowTranslation, favorite, width, toggleFav, hideChannel }) => {
	const halfWidth = width / 2;
	const trans = rowTranslation.interpolate({
		inputRange: [-ACTION_WIDTH, 0],
		outputRange: [width - ACTION_WIDTH, width]
	});
	const iconHideTrans = rowTranslation.interpolate({
		inputRange: [-(halfWidth - 20), -2 * ACTION_WIDTH, 0],
		outputRange: [0, 0, -ACTION_WIDTH]
	});
	// const iconFavWidth = rowTranslation.interpolate({
	// 	inputRange: [-halfWidth, -2 * ACTION_WIDTH, 0],
	// 	outputRange: [0, ACTION_WIDTH, ACTION_WIDTH],
	// 	extrapolate: 'clamp'
	// });
	// const iconHideWidth = rowTranslation.interpolate({
	// 	inputRange: [-width, -halfWidth, -2 * ACTION_WIDTH, 0],
	// 	outputRange: [width, halfWidth, ACTION_WIDTH, ACTION_WIDTH]
	// });
	return (
		<Animated.View
			style={[
				styles.rightAction,
				{ transform: [{ translateX: trans }] }
			]}
		>
			<Animated.View
				// style={{ width: iconFavWidth }}
			>
				<RectButton style={[styles.actionButtonRightFav]} onPress={toggleFav}>
					{favorite ? (
						<View style={styles.actionView}>
							<CustomIcon size={20} name='Star-filled' color='white' />
							<Text style={styles.actionText}>{I18n.t('Unfavorite')}</Text>
						</View>
					) : (
						<View style={styles.actionView}>
							<CustomIcon size={20} name='star' color='white' />
							<Text style={styles.actionText}>{I18n.t('Favorite')}</Text>
						</View>
					)}
				</RectButton>
			</Animated.View>
			<Animated.View style={[
				// { width: iconHideWidth },
				{ transform: [{ translateX: iconHideTrans }] }
			]}
			>
				<RectButton
					style={[styles.actionButtonRightHide]}
					onPress={hideChannel}
				>
					<View style={styles.actionView}>
						<CustomIcon size={20} name='eye-off' color='white' />
						<Text style={styles.actionText}>{I18n.t('Hide')}</Text>
					</View>
				</RectButton>
			</Animated.View>
		</Animated.View>
	);
});