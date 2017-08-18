import 'react-native';
import React from 'react';
import RoomItem from '../app/components/RoomItem';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

jest.mock('react-native-img-cache', () => {
	return {
		CachedImage: 'View'
	}
});

it('renders correctly', () => {
	const tree = renderer.create(
		<RoomItem
			type="d"
			name="name"
		/>
	).toJSON();
	expect(tree).toMatchSnapshot();
});
