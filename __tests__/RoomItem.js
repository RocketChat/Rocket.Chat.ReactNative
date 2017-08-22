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

const component = props => <RoomItem {...props} />

it('renders correctly', () => {
	const tree = renderer.create(component({ type: 'd', name: 'name' })).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render unread', () => {
	const tree = renderer.create(component({ type: 'd', name: 'name', unread: 1 })).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render unread +999', () => {
	const tree = renderer.create(component({ type: 'd', name: 'name', unread: 1000 })).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render no icon', () => {
	const tree = renderer.create(component({ type: 'X', name: 'name' })).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render private group', () => {
	const tree = renderer.create(component({ type: 'g', name: 'private-group' })).toJSON();
	expect(tree).toMatchSnapshot();
});

it('render channel', () => {
	const tree = renderer.create(component({ type: 'c', name: 'general' })).toJSON();
	expect(tree).toMatchSnapshot();
});
