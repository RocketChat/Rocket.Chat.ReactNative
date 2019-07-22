import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setSearch as setSearchAction } from '../../../actions/rooms';
import Header from './Header';

@connect(() => ({}), dispatch => ({
	setSearch: searchText => dispatch(setSearchAction(searchText))
}))
class ShareListHeader extends PureComponent {
	static propTypes = {
		setSearch: PropTypes.func
	}

	onSearchChangeText = (text) => {
		const { setSearch } = this.props;
		setSearch(text.trim());
	}

	render() {
		return (
			<Header
				onChangeSearchText={this.onSearchChangeText}
			/>
		);
	}
}

export default ShareListHeader;
