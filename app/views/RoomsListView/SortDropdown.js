import React, { PureComponent } from 'react';
import {
	View, Text, Animated, Easing, Image, TouchableWithoutFeedback
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Touch from '../../utils/touch';
import styles from './styles';
import RocketChat from '../../lib/rocketchat';
import { setPreference } from '../../actions/sortPreferences';
import log from '../../utils/log';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import Check from './Check';

const ANIMATION_DURATION = 200;

@connect(state => ({
	closeSortDropdown: state.rooms.closeSortDropdown
}), dispatch => ({
	setSortPreference: preference => dispatch(setPreference(preference))
}))
export default class Sort extends PureComponent {
	static propTypes = {
		closeSortDropdown: PropTypes.bool,
		close: PropTypes.func,
		sortBy: PropTypes.string,
		groupByType: PropTypes.bool,
		showFavorites: PropTypes.bool,
		showUnread: PropTypes.bool,
		setSortPreference: PropTypes.func
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

	componentDidUpdate(prevProps) {
		const { closeSortDropdown } = this.props;
		if (prevProps.closeSortDropdown !== closeSortDropdown) {
			this.close();
		}
	}

	setSortPreference = (param) => {
		const { setSortPreference } = this.props;

		try {
			setSortPreference(param);
			RocketChat.saveSortPreference(param);
		} catch (e) {
			log('RoomsListView.setSortPreference', e);
		}
	}

	sortByName = () => {
		this.setSortPreference({ sortBy: 'alphabetical' });
	}

	sortByActivity = () => {
		this.setSortPreference({ sortBy: 'activity' });
	}

	toggleGroupByType = () => {
		const { groupByType } = this.props;
		this.setSortPreference({ groupByType: !groupByType });
	}

	toggleGroupByFavorites = () => {
		const { showFavorites } = this.props;
		this.setSortPreference({ showFavorites: !showFavorites });
	}

	toggleUnread = () => {
		const { showUnread } = this.props;
		this.setSortPreference({ showUnread: !showUnread });
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
			outputRange: [-245, 41]
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 0.3]
		});
		const {
			sortBy, groupByType, showFavorites, showUnread
		} = this.props;

		return (
			[
				<TouchableWithoutFeedback key='sort-backdrop' onPress={this.close}>
					<Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>,
				<Animated.View
					key='sort-container'
					style={[styles.dropdownContainer, { transform: [{ translateY }] }]}
				>
					<Touch key='sort-alphabetical' style={styles.sortItemButton} onPress={this.sortByName}>
						<View style={styles.sortItemContainer}>
							<CustomIcon style={styles.sortIcon} size={22} name='sort' />
							<Text style={styles.sortItemText}>{I18n.t('Alphabetical')}</Text>
							{sortBy === 'alphabetical' ? <Check /> : null}
						</View>
					</Touch>
					<Touch key='sort-activity' style={styles.sortItemButton} onPress={this.sortByActivity}>
						<View style={styles.sortItemContainer}>
							<Image style={styles.sortIcon} source={{ uri: 'sort_activity' }} />
							<Text style={styles.sortItemText}>{I18n.t('Activity')}</Text>
							{sortBy === 'activity' ? <Check /> : null}
						</View>
					</Touch>
					<View style={styles.sortSeparator} />
					<Touch key='group-type' style={styles.sortItemButton} onPress={this.toggleGroupByType}>
						<View style={styles.sortItemContainer}>
							<CustomIcon style={styles.sortIcon} size={22} name='sort1' />
							<Text style={styles.sortItemText}>{I18n.t('Group_by_type')}</Text>
							{groupByType ? <Check /> : null}
						</View>
					</Touch>
					<Touch key='group-favorites' style={styles.sortItemButton} onPress={this.toggleGroupByFavorites}>
						<View style={styles.sortItemContainer}>
							<CustomIcon style={styles.sortIcon} size={22} name='star' />
							<Text style={styles.sortItemText}>{I18n.t('Group_by_favorites')}</Text>
							{showFavorites ? <Check /> : null}
						</View>
					</Touch>
					<Touch key='group-unread' style={styles.sortItemButton} onPress={this.toggleUnread}>
						<View style={styles.sortItemContainer}>
							<CustomIcon style={styles.sortIcon} size={22} name='eye-off' />
							<Text style={styles.sortItemText}>{I18n.t('Unread_on_top')}</Text>
							{showUnread ? <Check /> : null}
						</View>
					</Touch>
				</Animated.View>,
				<Touch
					key='sort-toggle'
					onPress={this.close}
					style={[styles.dropdownContainerHeader, styles.sortToggleContainerClose]}
				>
					<View style={styles.sortItemContainer}>
						<Text style={styles.sortToggleText}>{I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') })}</Text>
						<CustomIcon style={styles.sortIcon} size={22} name='sort1' />
					</View>
				</Touch>
			]
		);
	}
}
