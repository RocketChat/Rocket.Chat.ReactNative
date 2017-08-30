import 'react-native';
import React from 'react';
import RoomItem from '../app/components/RoomItem';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

jest.mock('react-native-img-cache', () => { return { CachedImage: 'View' } });

it('renders correctly', () => {
	expect(renderer.create(<RoomItem type="d" name="name" />).toJSON()).toMatchSnapshot();
});

it('render unread', () => {
	expect(renderer.create(<RoomItem type="d" name="name" unread={1} />).toJSON()).toMatchSnapshot();
});

it('render unread +999', () => {
	expect(renderer.create(<RoomItem type="d" name="name" unread={1000} />).toJSON()).toMatchSnapshot();
});

it('render no icon', () => {
	expect(renderer.create(<RoomItem type="X" name="name" />).toJSON()).toMatchSnapshot();
});

it('render private group', () => {
	expect(renderer.create(<RoomItem type="g" name="private-group" /> ).toJSON()).toMatchSnapshot();
});

it('render channel', () => {
	expect(renderer.create(<RoomItem type="c" name="general" />).toJSON()).toMatchSnapshot();
});
