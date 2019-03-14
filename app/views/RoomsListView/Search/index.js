import React from 'react';
import { View, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setSearch as setSearchAction } from '../../../actions/rooms';
import styles from './styles';
import I18n from '../../../i18n';

@connect(null, dispatch => ({
	setSearch: searchText => dispatch(setSearchAction(searchText))
}))
export default class RoomsListSearchView extends React.Component {
	static propTypes = {
		setSearch: PropTypes.func
	}

	componentDidMount() {
		this.inputSearch.focus();
	}

	onSearchChangeText(text) {
		const { setSearch } = this.props;
		setSearch(text.trim());
	}

	render() {
		return (
			<View style={styles.header} testID='rooms-list-view-header'>
				<TextInput
					ref={inputSearch => this.inputSearch = inputSearch}
					underlineColorAndroid='transparent'
					style={styles.inputSearch}
					onChangeText={text => this.onSearchChangeText(text)}
					returnKeyType='search'
					placeholder={I18n.t('Search')}
					placeholderTextColor='#eee'
					clearButtonMode='while-editing'
					blurOnSubmit
					autoCorrect={false}
					autoCapitalize='none'
				/>
			</View>
		);
	}
}
