import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import SearchBar from './SearchBar';
import Directory from './Directory';
import Sort from './Sort';

const styles = StyleSheet.create({
	cancel: {
		marginRight: 14
	}
});

const ListHeader = React.memo(({
	searchLength, sortBy, onChangeSearchText, toggleSort, goDirectory, hasCancel, onCancelPress
}) => (
	<React.Fragment>
		<SearchBar onChangeSearchText={onChangeSearchText} hasCancel={hasCancel} onCancelPress={onCancelPress} propsStyles={styles} />
		<Directory goDirectory={goDirectory} />
		<Sort searchLength={searchLength} sortBy={sortBy} toggleSort={toggleSort} />
	</React.Fragment>
));

ListHeader.propTypes = {
	searchLength: PropTypes.number,
	sortBy: PropTypes.string,
	onChangeSearchText: PropTypes.func,
	toggleSort: PropTypes.func,
	goDirectory: PropTypes.func,
	onCancelPress: PropTypes.func,
	hasCancel: PropTypes.bool
};

export default ListHeader;
