import { render, screen } from '@testing-library/react-native';

import { initStore } from '~/lib/store/auxStore';
import { mockedStore } from '~/reducers/mockedStore';
import { type TThreadModel } from '~/definitions';
import { type TPreviewRoom } from '~/definitions/TRoom';
import Header from '../Header';

jest.mock('~/containers/CustomIcon', () => {
	const { Text } = jest.requireActual('react-native');
	return { CustomIcon: ({ name }: { name: string }) => <Text testID={`icon-${name}`} /> };
});

const noThread = {} as TThreadModel;

beforeAll(() => {
	initStore(mockedStore);
});

describe('ShareView Header', () => {
	it.each([
		['a group DM picked from the share sheet gets the team icon', { rid: 'rid', t: 'd', usernames: ['a', 'b', 'c'] }, 'team'],
		['a 1-on-1 DM gets the mention icon', { rid: 'rid', t: 'd', usernames: ['a', 'b'] }, 'mention']
	] satisfies [string, TPreviewRoom, string][])('%s', (_, room, icon) => {
		render(<Header room={room} thread={noThread} />);

		expect(screen.getByTestId(`icon-${icon}`)).toBeOnTheScreen();
	});
});
