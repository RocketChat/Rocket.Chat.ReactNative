import { click, clickAlert, openDrawer, setValue, setValueAndEnter } from '.';
import { swipeDown } from './gestures';
// import data from '../../../e2e/data';

export const login = async () => {
	await setValueAndEnter('new-server-view-input', 'mobile');
	await click('workspace-view-login');
	await setValue('login-view-email', 'useronefvtetnpenrsrbowccakq');
	await setValueAndEnter('login-view-password', '123');
};

export const logout = async () => {
	await openDrawer();
	await click('sidebar-settings');
	await swipeDown(20);
	await click('settings-logout');
	await clickAlert();
};
