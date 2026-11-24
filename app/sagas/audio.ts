import { takeEvery } from 'redux-saga/effects';

import { APP } from '../actions/actionsTypes';
import { type IAppStart } from '../actions/app';
import { RootEnum } from '../definitions/redux/TRootEnum';
import AudioManager from '../lib/methods/AudioManager';

const closeAudioOutsideRooms = ({ root }: IAppStart) => {
	if (root !== RootEnum.ROOT_INSIDE) {
		AudioManager.closeAudio();
	}
};

export default function* root() {
	yield takeEvery(APP.START, closeAudioOutsideRooms);
}
