import React, { PureComponent } from 'react';
import {
	View, Text, Animated, Easing, TouchableWithoutFeedback
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import styles from '../styles';
import Touch from '../../../utils/touch';
import RocketChat from '../../../lib/rocketchat';
import { setPreference } from '../../../actions/sortPreferences';
import log from '../../../utils/log';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../lib/Icons';
import { withTheme } from '../../../theme';
import { themes } from '../../../constants/colors';
import { SortItemButton, SortItemContent } from './Item';

const ANIMATION_DURATION = 200;

class Sort extends PureComponent {
	static propTypes = {
		closeSortDropdown: PropTypes.bool,
		close: PropTypes.func,
		sortBy: PropTypes.string,
		groupByType: PropTypes.bool,
		showFavorites: PropTypes.bool,
		showUnread: PropTypes.bool,
		theme: PropTypes.string,
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
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View style={[styles.backdrop, { backgroundColor: themes[theme].backdropColor, opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>
				<Animated.View
					style={[
						styles.dropdownContainer,
						{
							transform: [{ translateY }],
							backgroundColor: themes[theme].backgroundColor,
							borderColor: themes[theme].separatorColor
						}
					]}
				>
					<Touch
						onPress={this.close}
						theme={theme}
					>
						<View style={[styles.dropdownContainerHeader, { borderColor: themes[theme].separatorColor }]}>
							<View style={styles.sortItemContainer}>
								<Text style={[styles.sortToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') })}</Text>
								<CustomIcon style={[styles.sortIcon, { color: themes[theme].auxiliaryText }]} size={22} name='sort1' />
							</View>
						</View>
					</Touch>
					<SortItemButton onPress={this.sortByName} theme={theme}>
						<SortItemContent
							icon='sort'
							label='Alphabetical'
							checked={sortBy === 'alphabetical'}
							theme={theme}
						/>
					</SortItemButton>
					<SortItemButton onPress={this.sortByActivity} theme={theme}>
						<SortItemContent
							imageUri='sort_activity'
							label='Activity'
							checked={sortBy === 'activity'}
							theme={theme}
						/>
					</SortItemButton>
					<View style={[styles.sortSeparator, { backgroundColor: themes[theme].separatorColor }]} />
					<SortItemButton onPress={this.toggleGroupByType} theme={theme}>
						<SortItemContent
							icon='sort1'
							label='Group_by_type'
							checked={groupByType}
							theme={theme}
						/>
					</SortItemButton>
					<SortItemButton onPress={this.toggleGroupByFavorites} theme={theme}>
						<SortItemContent
							icon='star'
							label='Group_by_favorites'
							checked={showFavorites}
							theme={theme}
						/>
					</SortItemButton>
					<SortItemButton onPress={this.toggleUnread} theme={theme}>
						<SortItemContent
							icon='eye-off'
							label='Unread_on_top'
							checked={showUnread}
							theme={theme}
						/>
					</SortItemButton>
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
