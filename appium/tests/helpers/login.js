import { click, clickAlert, openDrawer, setValue, setValueAndEnter } from '.';
import { swipeDown } from './gestures';

export const login = async () => {
	await setValueAndEnter('new-server-view-input', 'mobile');
	await click('workspace-view-login');
	await setValue('login-view-email', 'useroneqqshjglvfnkzamfqvgnb');
	await setValueAndEnter('login-view-password', '123');
};

export const logout = async () => {
	await openDrawer();
	await click('sidebar-settings');
	await swipeDown(20);
	await click('settings-logout');
	await clickAlert('Sair'); // iOS is text
};
