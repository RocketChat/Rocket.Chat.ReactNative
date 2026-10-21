import { render } from '@testing-library/react-native';

import SpeakingWhileMutedNotice from '../SpeakingWhileMutedNotice';
import { useSpeakingWhileMuted } from '../useSpeakingWhileMuted';

jest.mock('../useSpeakingWhileMuted', () => ({ useSpeakingWhileMuted: jest.fn() }));

const speakingMock = useSpeakingWhileMuted as jest.Mock;

describe('SpeakingWhileMutedNotice', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		speakingMock.mockReturnValue(true);
	});

	it('tells the user they are muted', () => {
		const { getByText } = render(<SpeakingWhileMutedNotice enabled />);

		expect(getByText('You are muted')).toBeTruthy();
	});

	it('is only information, so there is nothing to tap that would unmute', () => {
		const { queryByRole, getByTestId } = render(<SpeakingWhileMutedNotice enabled />);

		expect(queryByRole('button')).toBeNull();
		expect(getByTestId('conference-speaking-while-muted').props.pointerEvents).toBe('none');
	});

	it('says nothing while the user is not speaking', () => {
		speakingMock.mockReturnValue(false);

		const { queryByTestId } = render(<SpeakingWhileMutedNotice enabled />);

		expect(queryByTestId('conference-speaking-while-muted')).toBeNull();
	});

	it.each([true, false])('lets the hook know whether it should be listening (%s)', enabled => {
		render(<SpeakingWhileMutedNotice enabled={enabled} />);

		expect(speakingMock).toHaveBeenCalledWith(enabled);
	});
});
