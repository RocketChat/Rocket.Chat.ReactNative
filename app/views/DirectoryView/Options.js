import React, { PureComponent } from 'react';
import {
	View, Text, Animated, Easing, TouchableWithoutFeedback, Switch
} from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import Touch from '../../utils/touch';
import { CustomIcon } from '../../lib/Icons';
import Check from '../../containers/Check';
import I18n from '../../i18n';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';

const ANIMATION_DURATION = 200;
const ANIMATION_PROPS = {
	duration: ANIMATION_DURATION,
	easing: Easing.inOut(Easing.quad),
	useNativeDriver: true
};

export default class DirectoryOptions extends PureComponent {
	static propTypes = {
		type: PropTypes.string,
		globalUsers: PropTypes.bool,
		isFederationEnabled: PropTypes.bool,
		close: PropTypes.func,
		changeType: PropTypes.func,
		toggleWorkspace: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				...ANIMATION_PROPS
			}
		).start();
	}

	close = () => {
		const { close } = this.props;
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				...ANIMATION_PROPS
			}
		).start(() => close());
	}

	renderItem = (itemType) => {
		const { changeType, type: propType, theme } = this.props;
		let text = 'Users';
		let icon = 'user';
		if (itemType === 'channels') {
			text = 'Channels';
			icon = 'channel-public';
		}

		return (
			<Touch
				onPress={() => changeType(itemType)}
				style={styles.dropdownItemButton}
				theme={theme}
			>
				<View style={styles.dropdownItemContainer}>
					<CustomIcon style={[styles.dropdownItemIcon, { color: themes[theme].bodyText }]} size={22} name={icon} />
					<Text style={[styles.dropdownItemText, { color: themes[theme].bodyText }]}>{I18n.t(text)}</Text>
					{propType === itemType ? <Check theme={theme} /> : null}
				</View>
			</Touch>
		);
	}

	render() {
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-326, 0]
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 0.3]
		});
		const {
			globalUsers, toggleWorkspace, isFederationEnabled, theme
		} = this.props;
		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View style={[styles.backdrop, { backgroundColor: themes[theme].backdropColor, opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>
				<Animated.View style={[styles.dropdownContainer, { transform: [{ translateY }], backgroundColor: themes[theme].backgroundColor }]}>
					<Touch onPress={this.close} theme={theme}>
						<View style={[styles.dropdownContainerHeader, styles.dropdownItemContainer, { borderColor: themes[theme].separatorColor }]}>
							<Text style={[styles.dropdownToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Search_by')}</Text>
							<CustomIcon style={[styles.dropdownItemIcon, styles.inverted, { color: themes[theme].auxiliaryTintColor }]} size={22} name='chevron-down' />
						</View>
					</Touch>
					{this.renderItem('channels')}
					{this.renderItem('users')}
					{isFederationEnabled
						? (
							<>
								<View style={[styles.dropdownSeparator, { backgroundColor: themes[theme].separatorColor }]} />
								<View style={[styles.dropdownItemContainer, styles.globalUsersContainer]}>
									<View style={styles.globalUsersTextContainer}>
										<Text style={[styles.dropdownItemText, { color: themes[theme].infoText }]}>{I18n.t('Search_global_users')}</Text>
										<Text style={[styles.dropdownItemDescription, { color: themes[theme].infoText }]}>{I18n.t('Search_global_users_description')}</Text>
									</View>
									<Switch value={globalUsers} onValueChange={toggleWorkspace} trackColor={SWITCH_TRACK_COLOR} />
								</View>
							</>
						)
						: null}
				</Animated.View>
			</>
		);
	}
}
