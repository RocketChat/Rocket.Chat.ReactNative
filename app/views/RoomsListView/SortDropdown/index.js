import React, { PureComponent } from 'react';
import {
	Animated, Easing, TouchableWithoutFeedback
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '../styles';
import * as List from '../../../containers/List';
import Check from '../../../containers/Check';
import RocketChat from '../../../lib/rocketchat';
import { setPreference } from '../../../actions/sortPreferences';
import log, { logEvent, events } from '../../../utils/log';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../lib/Icons';
import { withTheme } from '../../../theme';
import { themes } from '../../../constants/colors';
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
					<List.Item
						title={I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') })}
						left={() => (
							<CustomIcon style={{ color: themes[theme].auxiliaryText }} size={22} name='sort' />
						)}
						color={themes[theme].auxiliaryText}
						onPress={this.close}
						theme={theme}
						translateTitle={false}
					/>
					<List.Item
						title={I18n.t('Alphabetical')}
						left={() => (
							<CustomIcon style={{ color: themes[theme].controlText }} size={22} name='sort-az' />
						)}
						color={themes[theme].controlText}
						onPress={this.sortByName}
						right={() => (sortBy === 'alphabetical' ? <Check theme={theme} /> : null)}
						theme={theme}
						translateTitle={false}
					/>
					<List.Item
						title={I18n.t('Activity')}
						left={() => (
							<CustomIcon style={{ color: themes[theme].controlText }} size={22} name='clock' />
						)}
						color={themes[theme].controlText}
						onPress={this.sortByActivity}
						right={() => (sortBy === 'activity' ? <Check theme={theme} /> : null)}
						theme={theme}
						translateTitle={false}
					/>
					<List.Separator style={styles.sortSeparator} />
					<List.Item
						title='Group_by_type'
						left={() => (
							<CustomIcon style={{ color: themes[theme].controlText }} size={22} name='group-by-type' />
						)}
						color={themes[theme].controlText}
						onPress={this.toggleGroupByType}
						right={() => (groupByType ? <Check theme={theme} /> : null)}
						theme={theme}
						translateTitle
					/>
					<List.Item
						title='Group_by_favorites'
						left={() => (
							<CustomIcon style={{ color: themes[theme].controlText }} size={22} name='star' />
						)}
						color={themes[theme].controlText}
						onPress={this.toggleGroupByFavorites}
						right={() => (showFavorites ? <Check theme={theme} /> : null)}
						theme={theme}
						translateTitle
					/>
					<List.Item
						title='Unread_on_top'
						left={() => (
							<CustomIcon style={{ color: themes[theme].controlText }} size={22} name='unread-on-top-disabled' />
						)}
						color={themes[theme].controlText}
						onPress={this.toggleUnread}
						right={() => (showUnread ? <Check theme={theme} /> : null)}
						theme={theme}
						translateTitle
					/>
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
