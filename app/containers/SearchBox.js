import React from 'react';
import {
	View, StyleSheet, Image, TextInput, Platform
} from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../i18n';

const styles = StyleSheet.create({
	container: {
		backgroundColor: Platform.OS === 'ios' ? '#F7F8FA' : '#54585E'
	},
	searchBox: {
		alignItems: 'center',
		backgroundColor: '#E1E5E8',
		borderRadius: 10,
		color: '#8E8E93',
		flexDirection: 'row',
		fontSize: 17,
		height: 36,
		margin: 16,
		marginVertical: 10,
		paddingHorizontal: 10
	},
	icon: {
		width: 14,
		height: 14
	},
	input: {
		color: '#8E8E93',
		flex: 1,
		fontSize: 17,
		marginLeft: 8,
		paddingTop: 0,
		paddingBottom: 0
	}
});

const SearchBox = ({ onChangeText, testID }) => (
	<View style={styles.container}>
		<View style={styles.searchBox}>
			<Image source={{ uri: 'textinput_search' }} style={styles.icon} />
			<TextInput
				autoCapitalize='none'
				autoCorrect={false}
				blurOnSubmit
				clearButtonMode='while-editing'
				placeholder={I18n.t('Search')}
				returnKeyType='search'
				style={styles.input}
				testID={testID}
				underlineColorAndroid='transparent'
				onChangeText={onChangeText}
			/>
		</View>
	</View>
);

SearchBox.propTypes = {
	onChangeText: PropTypes.func.isRequired,
	testID: PropTypes.string
};

export default SearchBox;
