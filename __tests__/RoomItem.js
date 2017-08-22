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

it('render unread', () => {
	const tree = renderer.create(
		<RoomItem
			type="d"
			name="name"
			unread={1}
		/>
	).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render unread +999', () => {
	const tree = renderer.create(
		<RoomItem
			type="d"
			name="name"
			unread={1000}
		/>
	).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render no icon', () => {
	const tree = renderer.create(
		<RoomItem
			type="X"
			name="name"
		/>
	).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render private group', () => {
	const tree = renderer.create(
		<RoomItem
			type="g"
			name="private-group"
		/>
	).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render channel', () => {
	const tree = renderer.create(
		<RoomItem
			type="c"
			name="general"
		/>
	).toJSON();
	expect(tree).toMatchSnapshot();
});
