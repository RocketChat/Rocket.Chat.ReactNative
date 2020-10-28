import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { withTheme } from '../../theme';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 16
	}
});

const ListContainer = React.memo(({ children, ...props }) => (
	<ScrollView
		contentContainerStyle={styles.container}
		showsVerticalScrollIndicator={false} // FIXME: we shouldn't need this, but vertical scroll is weird without it
		{...scrollPersistTaps}
		{...props}
	>
		{children}
	</ScrollView>
));

ListContainer.propTypes = {
	children: PropTypes.array.isRequired
};

ListContainer.displayName = 'List.Container';

export default withTheme(ListContainer);
