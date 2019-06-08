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

const ANIMATION_DURATION = 200;

export default class DirectoryOptions extends PureComponent {
	static propTypes = {
		type: PropTypes.string,
		globalUsers: PropTypes.bool,
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
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			},
		).start();
	}

	close = () => {
		const { close } = this.props;
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			},
		).start(() => close());
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
			type, globalUsers, changeType, toggleWorkspace
		} = this.props;
		return (
			<React.Fragment>
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
					<Touch style={styles.dropdownItemButton} onPress={() => changeType('channels')}>
						<View style={styles.dropdownItemContainer}>
							<CustomIcon style={styles.dropdownItemIcon} size={22} name='hashtag' />
							<Text style={styles.dropdownItemText}>{I18n.t('Channels')}</Text>
							{type === 'channels' ? <Check /> : null}
						</View>
					</Touch>
					<Touch style={styles.dropdownItemButton} onPress={() => changeType('users')}>
						<View style={styles.dropdownItemContainer}>
							<CustomIcon style={styles.dropdownItemIcon} size={22} name='user' />
							<Text style={styles.dropdownItemText}>{I18n.t('Users')}</Text>
							{type === 'users' ? <Check /> : null}
						</View>
					</Touch>
					<View style={styles.dropdownSeparator} />
					<View style={[styles.dropdownItemContainer, styles.globalUsersContainer]}>
						<View style={{ flex: 1, flexDirection: 'column' }}>
							<Text style={styles.dropdownItemText}>{I18n.t('Search_global_users')}</Text>
							<Text style={styles.dropdownItemDescription}>{I18n.t('Search_global_users_description')}</Text>
						</View>
						<Switch value={globalUsers} onValueChange={toggleWorkspace} />
					</View>
				</Animated.View>
			</React.Fragment>
		);
	}
}
