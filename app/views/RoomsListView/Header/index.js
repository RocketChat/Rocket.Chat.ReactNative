import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setSearch as setSearchAction } from '../../../actions/rooms';
import Header from './Header';

@connect(state => ({
	showSearchHeader: state.rooms.showSearchHeader,
	connecting: state.meteor.connecting || state.server.loading,
	isFetching: state.rooms.isFetching,
	serverName: state.settings.Site_Name
}), dispatch => ({
	setSearch: searchText => dispatch(setSearchAction(searchText))
}))
export default class RoomsListHeaderView extends PureComponent {
	static propTypes = {
		showSearchHeader: PropTypes.bool,
		serverName: PropTypes.string,
		connecting: PropTypes.bool,
		isFetching: PropTypes.bool,
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
			serverName, showSearchHeader, connecting, isFetching
		} = this.props;

		return (
			<Header
				serverName={serverName}
				showSearchHeader={showSearchHeader}
				connecting={connecting}
				isFetching={isFetching}
				setSearchInputRef={this.setSearchInputRef}
				onSearchChangeText={text => this.onSearchChangeText(text)}
			/>
		);
	}
}
