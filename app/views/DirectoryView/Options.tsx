import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Switch, Text, TouchableWithoutFeedback, View } from 'react-native';

import Touch from '../../containers/Touch';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import Check from '../../containers/Check';
import I18n from '../../i18n';
import { SWITCH_TRACK_COLOR, themes } from '../../lib/constants';
import styles from './styles';
import { TSupportedThemes } from '../../theme';

const ANIMATION_DURATION = 200;
const ANIMATION_PROPS = {
	duration: ANIMATION_DURATION,
	easing: Easing.inOut(Easing.quad),
	useNativeDriver: true
};

interface IDirectoryOptionsProps {
	type: string;
	globalUsers: boolean;
	isFederationEnabled: boolean;
	close: Function;
	changeType: Function;
	toggleWorkspace(): void;
	theme: TSupportedThemes;
}

const DirectoryOptions = memo(
	({
		type: propType,
		globalUsers,
		isFederationEnabled,
		close: onClose,
		changeType,
		toggleWorkspace,
		theme
	}: IDirectoryOptionsProps) => {
		const animatedValue = useRef(new Animated.Value(0)).current;

		useEffect(() => {
			Animated.timing(animatedValue, {
				toValue: 1,
				...ANIMATION_PROPS
			}).start();
		}, [animatedValue]);

		const close = () => {
			Animated.timing(animatedValue, {
				toValue: 0,
				...ANIMATION_PROPS
			}).start(() => onClose());
		};

		const renderItem = (itemType: string) => {
			let text = 'Users';
			let icon: TIconsName = 'user';
			if (itemType === 'channels') {
				text = 'Channels';
				icon = 'channel-public';
			}

			if (itemType === 'teams') {
				text = 'Teams';
				icon = 'teams';
			}

			return (
				<Touch onPress={() => changeType(itemType)} style={styles.dropdownItemButton} accessibilityLabel={I18n.t(text)}>
					<View style={styles.dropdownItemContainer}>
						<CustomIcon name={icon} size={22} color={themes[theme].bodyText} style={styles.dropdownItemIcon} />
						<Text style={[styles.dropdownItemText, { color: themes[theme].bodyText }]}>{I18n.t(text)}</Text>
						{propType === itemType ? <Check /> : null}
					</View>
				</Touch>
			);
		};

		const translateY = animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-326, 0]
		});

		const backdropOpacity = animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, themes[theme].backdropOpacity]
		});

		return (
			<>
				<TouchableWithoutFeedback onPress={close}>
					<Animated.View style={[styles.backdrop, { backgroundColor: themes[theme].backdropColor, opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>
				<Animated.View
					style={[styles.dropdownContainer, { transform: [{ translateY }], backgroundColor: themes[theme].backgroundColor }]}
				>
					<Touch onPress={close} accessibilityLabel={I18n.t('Search_by')}>
						<View
							style={[
								styles.dropdownContainerHeader,
								styles.dropdownItemContainer,
								{ borderColor: themes[theme].separatorColor }
							]}
						>
							<Text style={[styles.dropdownToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Search_by')}</Text>
							<CustomIcon
								style={[styles.dropdownItemIcon, styles.inverted]}
								size={22}
								name='chevron-down'
								color={themes[theme].auxiliaryTintColor}
							/>
						</View>
					</Touch>
					{renderItem('channels')}
					{renderItem('users')}
					{renderItem('teams')}
					{isFederationEnabled ? (
						<>
							<View style={[styles.dropdownSeparator, { backgroundColor: themes[theme].separatorColor }]} />
							<View style={[styles.dropdownItemContainer, styles.globalUsersContainer]}>
								<View style={styles.globalUsersTextContainer}>
									<Text style={[styles.dropdownItemText, { color: themes[theme].infoText }]}>
										{I18n.t('Search_global_users')}
									</Text>
									<Text style={[styles.dropdownItemDescription, { color: themes[theme].infoText }]}>
										{I18n.t('Search_global_users_description')}
									</Text>
								</View>
								<Switch value={globalUsers} onValueChange={toggleWorkspace} trackColor={SWITCH_TRACK_COLOR} />
							</View>
						</>
					) : null}
				</Animated.View>
			</>
		);
	}
);

export default DirectoryOptions;
