import React, { Component } from 'react';
import { View, Text, Animated, Easing, Image, TouchableWithoutFeedback } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Touch from './touch';
import styles from './styles';
import RocketChat from '../../lib/rocketchat';
import { setPreference } from '../../actions/login';

@connect(null, dispatch => ({
	setPreference: preference => dispatch(setPreference(preference))
}))
export default class componentName extends Component {
	static propTypes = {
		close: PropTypes.func.isRequired,
		sidebarSortby: PropTypes.string,
		sidebarGroupByType: PropTypes.bool,
		sidebarShowFavorites: PropTypes.bool,
		sidebarShowUnread: PropTypes.bool,
		setPreference: PropTypes.func
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
				duration: 300,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start();
	}

	saveUserPreference = async(param) => {
		try {
			await RocketChat.saveUserPreferences(param);
		} catch (e) {
			console.warn(e);
		}
	}

	sortByName = () => {
		this.props.setPreference({ sidebarSortby: 'alphabetical' });
		this.saveUserPreference({ sidebarSortby: 'alphabetical' });
	}

	sortByActivity = () => {
		this.props.setPreference({ sidebarSortby: 'activity' });
		this.saveUserPreference({ sidebarSortby: 'activity' });
	}

	toggleGroupByType = () => {
		this.saveUserPreference({ sidebarGroupByType: !this.props.sidebarGroupByType });
	}

	toggleGroupByFavorites = () => {
		this.saveUserPreference({ sidebarShowFavorites: !this.props.sidebarShowFavorites });
	}

	toggleUnread = () => {
		this.saveUserPreference({ sidebarShowUnread: !this.props.sidebarShowUnread });
	}

	close = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: 300,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start(() => this.props.close());
	}

	render() {
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-400, 41]
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 0.3]
		});
		const {
			sidebarSortby, sidebarGroupByType, sidebarShowFavorites, sidebarShowUnread
		} = this.props;
		return (
			[
				<TouchableWithoutFeedback key='sort-backdrop' onPress={this.close}>
					<Animated.View style={[styles.sortBackdrop, { opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>,
				<Animated.View
					key='sort-container'
					style={[styles.sortContainer, { transform: [{ translateY }] }]}
				>
					<Touch key='sort-alphabetical' style={styles.sortItemButton} onPress={() => this.saveUserPreference({ sidebarSortby: 'alphabetical' })}>
						<View style={styles.sortItemContainer}>
							<Image style={styles.sortIconLeft} source={require('../../static/images/sort_alphabetically.png')} />
							<Text style={styles.sortItemText}>Alphabetical</Text>
							{sidebarSortby === 'alphabetical' ? <Image style={styles.sortIconLeft} source={require('../../static/images/check.png')} /> : null}
						</View>
					</Touch>
					<Touch key='sort-activity' style={styles.sortItemButton} onPress={this.sortByActivity}>
						<View style={styles.sortItemContainer}>
							<Image style={styles.sortIconLeft} source={require('../../static/images/sort_activity.png')} />
							<Text style={styles.sortItemText}>Activity</Text>
							{sidebarSortby === 'activity' ? <Image style={styles.sortIconLeft} source={require('../../static/images/check.png')} /> : null}
						</View>
					</Touch>
					<View style={styles.sortSeparator} />
					<Touch key='group-type' style={styles.sortItemButton} onPress={this.toggleGroupByType}>
						<View style={styles.sortItemContainer}>
							<Image style={styles.sortIconLeft} source={require('../../static/images/group_type.png')} />
							<Text style={styles.sortItemText}>Group by type</Text>
							{sidebarGroupByType ? <Image style={styles.sortIconLeft} source={require('../../static/images/check.png')} /> : null}
						</View>
					</Touch>
					<Touch key='group-favorites' style={styles.sortItemButton} onPress={this.toggleGroupByFavorites}>
						<View style={styles.sortItemContainer}>
							<Image style={styles.sortIconLeft} source={require('../../static/images/group_favorites.png')} />
							<Text style={styles.sortItemText}>Group by favorites</Text>
							{sidebarShowFavorites ? <Image style={styles.sortIconLeft} source={require('../../static/images/check.png')} /> : null}
						</View>
					</Touch>
					<Touch key='group-unread' style={styles.sortItemButton} onPress={this.toggleUnread}>
						<View style={styles.sortItemContainer}>
							<Image style={styles.sortIconLeft} source={require('../../static/images/group_unread.png')} />
							<Text style={styles.sortItemText}>Unread on top</Text>
							{sidebarShowUnread ? <Image style={styles.sortIconLeft} source={require('../../static/images/check.png')} /> : null}
						</View>
					</Touch>
				</Animated.View>,
				<Touch
					key='sort-toggle'
					onPress={this.close}
					style={[styles.sortToggleContainer, styles.sortToggleContainerClose]}
				>
					<View style={styles.sortItemContainer}>
						<Text style={styles.sortToggleText}>Sorting by {sidebarSortby === 'alphabetical' ? 'name' : 'activity'}</Text>
						<Image style={styles.sortIconLeft} source={require('../../static/images/group_type.png')} />
					</View>
				</Touch>
			]
		);
	}
}
