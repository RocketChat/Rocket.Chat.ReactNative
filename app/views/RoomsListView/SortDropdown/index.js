import React, { PureComponent } from 'react';
import {
	Animated, Easing, TouchableWithoutFeedback
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '../styles';
import * as List from '../../../containers/List';
import RocketChat from '../../../lib/rocketchat';
import { setPreference } from '../../../actions/sortPreferences';
import log, { logEvent, events } from '../../../utils/log';
import I18n from '../../../i18n';
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

	renderCheck = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].tintColor} />;
	}

	render() {
		const { isMasterDetail, insets } = this.props;
		const statusBarHeight = insets?.top ?? 0;
		const heightDestination = isMasterDetail ? headerHeight + statusBarHeight : 0;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-326, heightDestination]
		});
		const {
			sortBy, groupByType, showFavorites, showUnread, theme
		} = this.props;
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, themes[theme].backdropOpacity]
		});

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
						left={() => <List.Icon name='sort' />}
						color={themes[theme].auxiliaryText}
						onPress={this.close}
						translateTitle={false}
					/>
					<List.Separator />
					<List.Item
						title='Alphabetical'
						left={() => <List.Icon name='sort-az' />}
						color={themes[theme].auxiliaryText}
						onPress={this.sortByName}
						right={() => (sortBy === 'alphabetical' ? this.renderCheck() : null)}
					/>
					<List.Item
						title='Activity'
						left={() => <List.Icon name='clock' />}
						color={themes[theme].auxiliaryText}
						onPress={this.sortByActivity}
						right={() => (sortBy === 'activity' ? this.renderCheck() : null)}
					/>
					<List.Separator />
					<List.Item
						title='Group_by_type'
						left={() => <List.Icon name='group-by-type' />}
						color={themes[theme].auxiliaryText}
						onPress={this.toggleGroupByType}
						right={() => (groupByType ? this.renderCheck() : null)}
					/>
					<List.Item
						title='Group_by_favorites'
						left={() => <List.Icon name='star' />}
						color={themes[theme].auxiliaryText}
						onPress={this.toggleGroupByFavorites}
						right={() => (showFavorites ? this.renderCheck() : null)}
					/>
					<List.Item
						title='Unread_on_top'
						left={() => <List.Icon name='unread-on-top-disabled' />}
						color={themes[theme].auxiliaryText}
						onPress={this.toggleUnread}
						right={() => (showUnread ? this.renderCheck() : null)}
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
