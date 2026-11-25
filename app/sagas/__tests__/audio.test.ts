jest.mock('~/lib/methods/AudioManager', () => ({
	__esModule: true,
	default: { closeAudio: jest.fn() }
}));

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { appStart } from '~/actions/app';
import { RootEnum } from '~/definitions/redux/TRootEnum';
import AudioManager from '~/lib/methods/AudioManager';
import audioRoot from '../audio';

const startStore = () => {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore((state = {}) => state, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(audioRoot);
	return store;
};

describe('audio saga', () => {
	beforeEach(() => {
		jest.mocked(AudioManager.closeAudio).mockClear();
	});

	it.each([RootEnum.ROOT_LOADING, RootEnum.ROOT_OUTSIDE, RootEnum.ROOT_SET_USERNAME, RootEnum.ROOT_SHARE_EXTENSION])(
		'closes the audio when the app moves to %s',
		root => {
			startStore().dispatch(appStart({ root }));

			expect(AudioManager.closeAudio).toHaveBeenCalledTimes(1);
		}
	);

	it('keeps the audio when the app stays on the signed-in screens', () => {
		startStore().dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));

		expect(AudioManager.closeAudio).not.toHaveBeenCalled();
	});
});
