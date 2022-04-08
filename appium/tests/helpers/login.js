import { click, clickById, scrollToBottom, setValue, setValueAndEnter } from '.';
import data from '../../../e2e/data';

export const login = async () => {
	await setValueAndEnter('new-server-view-input', 'mobile');
	await click('workspace-view-login');
	await setValue('login-view-email', 'useronefvtetnpenrsrbowccakq');
	await setValueAndEnter('login-view-password', '123');
};

export const logout = async () => {
	await $('//android.view.ViewGroup[@content-desc="rooms-list-view-sidebar"]/android.widget.TextView').click(); //TEMP
	await click('sidebar-settings');
	await click('sidebar-settings');
	// await scrollToBottom();
	await click('settings-logout');
	await click('settings-logout');
	await clickById('android:id/button1');
};
