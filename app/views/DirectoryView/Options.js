import React, { PureComponent } from 'react';
import {
	View, Text, Animated, Easing, TouchableWithoutFeedback, Switch
} from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../utils/touch';
import styles from './styles';
import { CustomIcon } from '../../lib/Icons';
import Check from '../../containers/Check';
import I18n from '../../i18n';
import { SWITCH_TRACK_COLOR } from '../../constants/colors';

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
		toggleWorkspace: PropTypes.func
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
		const { changeType, type: propType } = this.props;
		let text = 'Users';
		let icon = 'user';
		if (itemType === 'channels') {
			text = 'Channels';
			icon = 'hashtag';
		}

		return (
			<Touch style={styles.dropdownItemButton} onPress={() => changeType(itemType)}>
				<View style={styles.dropdownItemContainer}>
					<CustomIcon style={styles.dropdownItemIcon} size={22} name={icon} />
					<Text style={styles.dropdownItemText}>{I18n.t(text)}</Text>
					{propType === itemType ? <Check /> : null}
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
		const { globalUsers, toggleWorkspace, isFederationEnabled } = this.props;
		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>
				<Animated.View style={[styles.dropdownContainer, { transform: [{ translateY }] }]}>
					<Touch
						onPress={this.close}
						style={styles.dropdownContainerHeader}
					>
						<View style={styles.dropdownItemContainer}>
							<Text style={styles.dropdownToggleText}>{I18n.t('Search_by')}</Text>
							<CustomIcon style={[styles.dropdownItemIcon, styles.inverted]} size={22} name='arrow-down' />
						</View>
					</Touch>
					{this.renderItem('channels')}
					{this.renderItem('users')}
					{isFederationEnabled
						? (
							<>
								<View style={styles.dropdownSeparator} />
								<View style={[styles.dropdownItemContainer, styles.globalUsersContainer]}>
									<View style={styles.globalUsersTextContainer}>
										<Text style={styles.dropdownItemText}>{I18n.t('Search_global_users')}</Text>
										<Text style={styles.dropdownItemDescription}>{I18n.t('Search_global_users_description')}</Text>
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
