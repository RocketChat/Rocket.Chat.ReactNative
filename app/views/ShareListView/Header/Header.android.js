import React, { PureComponent } from 'react';
import {
	View, StyleSheet, Text
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { TextInput } from 'react-native-gesture-handler';

import I18n from '../../../i18n';
import { COLOR_WHITE, HEADER_TITLE } from '../../../constants/colors';
import sharedStyles from '../../Styles';

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
		fontSize: 20,
		...sharedStyles.textBold,
		color: HEADER_TITLE,
		marginHorizontal: 16
	}
});

@connect(state => ({
	showSearchHeader: state.rooms.showSearchHeader
}))
class Header extends PureComponent {
	static propTypes = {
		showSearchHeader: PropTypes.bool,
		onChangeSearchText: PropTypes.func
	}

	componentDidUpdate(prevProps) {
		const { showSearchHeader } = this.props;
		if (showSearchHeader && prevProps.showSearchHeader !== showSearchHeader) {
			setTimeout(() => {
				this.searchInputRef.focus();
			}, 300);
		}
	}

	setSearchInputRef = (ref) => {
		this.searchInputRef = ref;
	}

	render() {
		const {
			showSearchHeader, onChangeSearchText
		} = this.props;

		if (showSearchHeader) {
			return (
				<View style={styles.container}>
					<TextInput
						ref={this.setSearchInputRef}
						style={styles.search}
						placeholder={I18n.t('Search')}
						placeholderTextColor='rgba(255, 255, 255, 0.5)'
						onChangeText={onChangeSearchText}
					/>
				</View>
			);
		}
		return <Text style={styles.title}>{I18n.t('Send_to')}</Text>;
	}
}

export default Header;
