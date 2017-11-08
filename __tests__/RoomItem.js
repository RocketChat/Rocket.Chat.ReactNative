import 'react-native';
import React from 'react';
import RoomItem from '../app/presentation/RoomItem';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

const date = new Date(2017, 10, 10, 10);
const dateFormat = 'MM-DD-YYYY HH:mm:ss';

jest.mock('react-native-img-cache', () => { return { CachedImage: 'View' } });

it('renders correctly', () => {
	expect(renderer.create(<RoomItem type="d" dateFormat={dateFormat} _updatedAt={date} name="name" />).toJSON()).toMatchSnapshot();
});

it('render unread', () => {
	expect(renderer.create(<RoomItem type="d" dateFormat={dateFormat} _updatedAt={date} name="name" unread={1} />).toJSON()).toMatchSnapshot();
});

it('render unread +999', () => {
	expect(renderer.create(<RoomItem type="d" dateFormat={dateFormat} _updatedAt={date} name="name" unread={1000} />).toJSON()).toMatchSnapshot();
});

it('render no icon', () => {
	expect(renderer.create(<RoomItem type="X" dateFormat={dateFormat} _updatedAt={date} name="name" />).toJSON()).toMatchSnapshot();
});

it('render private group', () => {
	expect(renderer.create(<RoomItem type="g" dateFormat={dateFormat} _updatedAt={date} name="private-group" /> ).toJSON()).toMatchSnapshot();
});

it('render channel', () => {
	expect(renderer.create(<RoomItem type="c" dateFormat={dateFormat} _updatedAt={date} name="general" />).toJSON()).toMatchSnapshot();
});
