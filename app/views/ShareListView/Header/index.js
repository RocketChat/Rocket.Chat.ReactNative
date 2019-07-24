import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setSearch as setSearchAction } from '../../../actions/rooms';
import Header from './Header';

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

	onSearchChangeText = (text) => {
		const { setSearch } = this.props;
		setSearch(text.trim());
	}

	render() {
		const { showSearchHeader } = this.props;

		return (
			<Header
				showSearchHeader={showSearchHeader}
				onChangeSearchText={this.onSearchChangeText}
			/>
		);
	}
}

export default ShareListHeader;
