import React, { PureComponent } from 'react';
import {
	View, StyleSheet, Text, Platform
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { TextInput } from 'react-native-gesture-handler';

import I18n from '../../i18n';
import { COLOR_WHITE, HEADER_TITLE } from '../../constants/colors';
import sharedStyles from '../Styles';
import { setSearch as setSearchAction } from '../../actions/rooms';
import { isAndroid } from '../../utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	search: {
		fontSize: 20,
		color: COLOR_WHITE,
		...sharedStyles.textRegular
	},
	title: {
		...Platform.select({
			ios: {
				fontSize: 17,
				...sharedStyles.textSemibold,
				color: HEADER_TITLE
			},
			android: {
				fontSize: 20,
				...sharedStyles.textRegular,
				color: HEADER_TITLE
			}
		})
	}
});

@connect(state => ({
	showSearchHeader: state.rooms.showSearchHeader
}), dispatch => ({
	setSearch: searchText => dispatch(setSearchAction(searchText))
}))
class ShareListHeader extends PureComponent {
	static propTypes = {
		showSearchHeader: PropTypes.bool,
		setSearch: PropTypes.func
	}

	componentDidUpdate(prevProps) {
		const { showSearchHeader } = this.props;
		if (showSearchHeader && prevProps.showSearchHeader !== showSearchHeader) {
			setTimeout(() => {
				this.searchInputRef.focus();
			}, 300);
		}
	}

	onSearchChangeText = (text) => {
		const { setSearch } = this.props;
		setSearch(text.trim());
	}

	setSearchInputRef = (ref) => {
		this.searchInputRef = ref;
	}

	render() {
		const {
			showSearchHeader
		} = this.props;

		if (showSearchHeader && isAndroid) {
			return (
				<View style={styles.container}>
					<TextInput
						ref={this.setSearchInputRef}
						style={styles.search}
						placeholder={I18n.t('Search')}
						placeholderTextColor='rgba(255, 255, 255, 0.5)'
						onChangeText={this.onSearchChangeText}
					/>
				</View>
			);
		}
		return <Text style={styles.title}>{I18n.t('Select_Channels')}</Text>;
	}
}

export default ShareListHeader;
