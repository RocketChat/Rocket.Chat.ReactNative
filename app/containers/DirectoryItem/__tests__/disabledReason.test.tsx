import { fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import IOSDirectoryItem from '../index.ios';
import EventEmitter from '~/lib/methods/helpers/events';
import { LISTENER } from '~/containers/Toast';
import { mockedStore } from '~/reducers/mockedStore';

const AndroidDirectoryItem = require('../index.tsx').default;

describe.each([
	['Android', AndroidDirectoryItem],
	['iOS', IOSDirectoryItem]
])('%s DirectoryItem with a disabled reason', (_platform, DirectoryItem) => {
	it('announces the reason and shows it on tap instead of pressing', () => {
		const onPress = jest.fn();
		const emit = jest.spyOn(EventEmitter, 'emit');
		render(
			<Provider store={mockedStore}>
				<DirectoryItem
					title='Encrypted room'
					avatar='E'
					type='p'
					onPress={onPress}
					disabledReason='Waiting for encryption keys'
					testID='directory-item'
				/>
			</Provider>
		);

		expect(screen.getByLabelText('Encrypted room  Waiting for encryption keys')).toBeOnTheScreen();
		fireEvent.press(screen.getAllByTestId('directory-item').at(-1)!);

		expect(onPress).not.toHaveBeenCalled();
		expect(emit).toHaveBeenCalledWith(LISTENER, { message: 'Waiting for encryption keys' });
		emit.mockRestore();
	});
});
