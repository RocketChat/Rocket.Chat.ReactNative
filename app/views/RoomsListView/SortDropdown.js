import React, { PureComponent } from 'react';
import {
	View, Text, Animated, Easing, Image, TouchableWithoutFeedback
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';

import styles from './styles';
import RocketChat from '../../lib/rocketchat';
import { setPreference } from '../../actions/sortPreferences';
import log from '../../utils/log';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import Check from '../../containers/Check';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';

const ANIMATION_DURATION = 200;

class Sort extends PureComponent {
	static propTypes = {
		closeSortDropdown: PropTypes.bool,
		close: PropTypes.func,
		sortBy: PropTypes.string,
		groupByType: PropTypes.bool,
		showFavorites: PropTypes.bool,
		showUnread: PropTypes.bool,
		setSortPreference: PropTypes.func,
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
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			}
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
			log(e);
		}
	}

	sortByName = () => {
		this.setSortPreference({ sortBy: 'alphabetical' });
		this.close();
	}

	sortByActivity = () => {
		this.setSortPreference({ sortBy: 'activity' });
		this.close();
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
			}
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
			sortBy, groupByType, showFavorites, showUnread, theme
		} = this.props;

		return (
			<>
				<TouchableWithoutFeedback key='sort-backdrop' onPress={this.close}>
					<Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>
				<Animated.View
					key='sort-container'
					style={[
						styles.dropdownContainer,
						{
							transform: [{ translateY }],
							backgroundColor: themes[theme].backgroundColor,
							borderColor: themes[theme].separatorColor
						}
					]}
				>
					<RectButton
						onPress={this.close}
						activeOpacity={1}
						underlayColor={themes[theme].bannerBackground}
						style={styles.dropdownContainerHeader}
						key='sort-toggle'
					>
						<View style={styles.sortItemContainer}>
							<Text style={styles.sortToggleText}>{I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') })}</Text>
							<CustomIcon style={styles.sortIcon} size={22} name='sort1' />
						</View>
					</RectButton>
					<RectButton
						onPress={this.sortByName}
						activeOpacity={1}
						underlayColor={themes[theme].bannerBackground}
						style={styles.sortItemButton}
						key='sort-alphabetical'
					>
						<View style={styles.sortItemContainer}>
							<CustomIcon style={styles.sortIcon} size={22} name='sort' />
							<Text style={styles.sortItemText}>{I18n.t('Alphabetical')}</Text>
							{sortBy === 'alphabetical' ? <Check /> : null}
						</View>
					</RectButton>
					<RectButton
						onPress={this.sortByActivity}
						activeOpacity={1}
						underlayColor={themes[theme].bannerBackground}
						style={styles.sortItemButton}
						key='sort-activity'
					>
						<View style={styles.sortItemContainer}>
							<Image style={styles.sortIcon} source={{ uri: 'sort_activity' }} />
							<Text style={styles.sortItemText}>{I18n.t('Activity')}</Text>
							{sortBy === 'activity' ? <Check /> : null}
						</View>
					</RectButton>
					<View style={styles.sortSeparator} />
					<RectButton
						onPress={this.toggleGroupByType}
						activeOpacity={1}
						underlayColor={themes[theme].bannerBackground}
						style={styles.sortItemButton}
						key='group-type'
					>
						<View style={styles.sortItemContainer}>
							<CustomIcon style={styles.sortIcon} size={22} name='sort1' />
							<Text style={styles.sortItemText}>{I18n.t('Group_by_type')}</Text>
							{groupByType ? <Check /> : null}
						</View>
					</RectButton>
					<RectButton
						onPress={this.toggleGroupByFavorites}
						activeOpacity={1}
						underlayColor={themes[theme].bannerBackground}
						style={styles.sortItemButton}
						key='group-favorites'
					>
						<View style={styles.sortItemContainer}>
							<CustomIcon style={styles.sortIcon} size={22} name='star' />
							<Text style={styles.sortItemText}>{I18n.t('Group_by_favorites')}</Text>
							{showFavorites ? <Check /> : null}
						</View>
					</RectButton>
					<RectButton
						onPress={this.toggleUnread}
						activeOpacity={1}
						underlayColor={themes[theme].bannerBackground}
						style={styles.sortItemButton}
						key='group-unread'
					>
						<View style={styles.sortItemContainer}>
							<CustomIcon style={styles.sortIcon} size={22} name='eye-off' />
							<Text style={styles.sortItemText}>{I18n.t('Unread_on_top')}</Text>
							{showUnread ? <Check /> : null}
						</View>
					</RectButton>
				</Animated.View>
			</>
		);
	}
}

const mapStateToProps = state => ({
	closeSortDropdown: state.rooms.closeSortDropdown
});

const mapDispatchToProps = dispatch => ({
	setSortPreference: preference => dispatch(setPreference(preference))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(Sort));
