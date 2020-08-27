import React, { PureComponent } from 'react';
import {
	View, Text, Animated, Easing, TouchableWithoutFeedback
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '../styles';
import Touch from '../../../utils/touch';
import RocketChat from '../../../lib/rocketchat';
import { setPreference } from '../../../actions/sortPreferences';
import log, { logEvent, events } from '../../../utils/log';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../lib/Icons';
import { withTheme } from '../../../theme';
import { themes } from '../../../constants/colors';
import { SortItemButton, SortItemContent } from './Item';
import { headerHeight } from '../../../containers/Header';

const ANIMATION_DURATION = 200;

class Sort extends PureComponent {
	static propTypes = {
		closeSortDropdown: PropTypes.bool,
		close: PropTypes.func,
		sortBy: PropTypes.string,
		groupByType: PropTypes.bool,
		showFavorites: PropTypes.bool,
		showUnread: PropTypes.bool,
		isMasterDetail: PropTypes.bool,
		theme: PropTypes.string,
		insets: PropTypes.object,
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
			logEvent(events.RL_SORT_CHANNELS_F);
			log(e);
		}
	}

	sortByName = () => {
		logEvent(events.RL_SORT_CHANNELS_BY_NAME);
		this.setSortPreference({ sortBy: 'alphabetical' });
		this.close();
	}

	sortByActivity = () => {
		logEvent(events.RL_SORT_CHANNELS_BY_ACTIVITY);
		this.setSortPreference({ sortBy: 'activity' });
		this.close();
	}

	toggleGroupByType = () => {
		logEvent(events.RL_GROUP_CHANNELS_BY_TYPE);
		const { groupByType } = this.props;
		this.setSortPreference({ groupByType: !groupByType });
	}

	toggleGroupByFavorites = () => {
		logEvent(events.RL_GROUP_CHANNELS_BY_FAVORITE);
		const { showFavorites } = this.props;
		this.setSortPreference({ showFavorites: !showFavorites });
	}

	toggleUnread = () => {
		logEvent(events.RL_GROUP_CHANNELS_BY_UNREAD);
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
		const { isMasterDetail, insets } = this.props;
		const statusBarHeight = insets?.top ?? 0;
		const heightDestination = isMasterDetail ? headerHeight + statusBarHeight : 0;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-326, heightDestination]
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
					<Animated.View style={[styles.backdrop,
						{
							backgroundColor: themes[theme].backdropColor,
							opacity: backdropOpacity,
							top: heightDestination
						}]}
					/>
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
								<CustomIcon style={[styles.sortIcon, { color: themes[theme].auxiliaryText }]} size={22} name='sort' />
								<Text style={[styles.sortToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') })}</Text>
							</View>
						</View>
					</Touch>
					<SortItemButton onPress={this.sortByName} theme={theme}>
						<SortItemContent
							icon='sort-az'
							label='Alphabetical'
							checked={sortBy === 'alphabetical'}
							theme={theme}
						/>
					</SortItemButton>
					<SortItemButton onPress={this.sortByActivity} theme={theme}>
						<SortItemContent
							icon='clock'
							label='Activity'
							checked={sortBy === 'activity'}
							theme={theme}
						/>
					</SortItemButton>
					<View style={[styles.sortSeparator, { backgroundColor: themes[theme].separatorColor }]} />
					<SortItemButton onPress={this.toggleGroupByType} theme={theme}>
						<SortItemContent
							icon='group-by-type'
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
							icon='unread-on-top-disabled'
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
	closeSortDropdown: state.rooms.closeSortDropdown,
	isMasterDetail: state.app.isMasterDetail
});

const mapDispatchToProps = dispatch => ({
	setSortPreference: preference => dispatch(setPreference(preference))
});

export default connect(mapStateToProps, mapDispatchToProps)(withSafeAreaInsets(withTheme(Sort)));
