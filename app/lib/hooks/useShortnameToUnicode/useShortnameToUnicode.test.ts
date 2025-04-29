import useShortnameToUnicode from './index';
import { setUser } from '../../../actions/login';
import { mockedStore } from '../../../reducers/mockedStore';

jest.mock('../useAppSelector', () => ({
	useAppSelector: () => mockedStore.getState().login.user.settings?.preferences?.convertAsciiEmoji
}));

const initialMockedStoreState = () => {
	mockedStore.dispatch(
		setUser({
			settings: {
				preferences: {
					convertAsciiEmoji: true
				}
			}
		})
	);
};

initialMockedStoreState();

test('render joy', () => {
	const shortnameToUnicode = useShortnameToUnicode(':joy:');
	expect(shortnameToUnicode).toBe('😂');
});

test('render several emojis', () => {
	const shortnameToUnicode = useShortnameToUnicode(':dog::cat::hamburger::icecream::rocket:');
	expect(shortnameToUnicode).toBe('🐶🐱🍔🍦🚀');
});

test('render unknown emoji', () => {
	const shortnameToUnicode = useShortnameToUnicode(':unknown:');
	expect(shortnameToUnicode).toBe(':unknown:');
});

test('render empty', () => {
	const shortnameToUnicode = useShortnameToUnicode('');
	expect(shortnameToUnicode).toBe('');
});

test('render text with emoji', () => {
	const shortnameToUnicode = useShortnameToUnicode('Hello there! :hugging:');
	expect(shortnameToUnicode).toBe('Hello there! 🤗');
});

test('render ascii smile', () => {
	const shortnameToUnicode = useShortnameToUnicode(':)');
	expect(shortnameToUnicode).toBe('🙂');
});

test('render several ascii emojis', () => {
	const shortnameToUnicode = useShortnameToUnicode(":) :( -_- ':-D");
	expect(shortnameToUnicode).toBe('🙂😞😑😅');
});

test('render text with ascii emoji', () => {
	const shortnameToUnicode = useShortnameToUnicode('Hello there! :)');
	expect(shortnameToUnicode).toBe('Hello there!🙂');
});

test('render emoji and ascii emoji', () => {
	const shortnameToUnicode = useShortnameToUnicode("':-D :joy:");
	expect(shortnameToUnicode).toBe('😅 😂');
});

test('convert ascii when convertAsciiEmoji = true', () => {
	const shortnameToUnicode = useShortnameToUnicode(':(');
	expect(shortnameToUnicode).toBe('😞');
});

test('do NOT convert ascii when convertAsciiEmoji = false', () => {
	mockedStore.dispatch(
		setUser({
			settings: {
				preferences: {
					convertAsciiEmoji: false
				}
			}
		})
	);

	const shortnameToUnicode = useShortnameToUnicode(':(');
	expect(shortnameToUnicode).toBe(':(');
});
