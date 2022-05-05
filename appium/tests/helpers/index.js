const { expect } = require('chai');

export const launchApp = async () => await driver.launchApp();

export const setValue = async (tag, value) => await $(`~${tag}`).setValue(`${value}`);

export const getText = async tag => await $(`~${tag}`).getText();

export const equal = async (value, text) => expect(value).to.equal(prop);

export const click = async tag => await $(`~${tag}`).click();

export const clickById = async tag => await $(`id=${tag}`).click();

export const isAndroid = () => driver.capabilities.platformName === 'Android';

export const openDrawer = async () => {
	if (isAndroid()) {
		await $('//android.view.ViewGroup[@content-desc="rooms-list-view-sidebar"]/android.widget.TextView').click(); //TEMP
	} else {
		await $('[name="rooms-list-view-sidebar"]').click();
	}
};

export const clickAlert = async tag => {
	if (isAndroid()) {
		await clickById('android:id/button1');
	} else {
		await $(`[name="${tag}"]`).click();
	}
};

export const setValueAndEnter = async (tag, value) => {
	if (isAndroid()) {
		await $(`~${tag}`).click();
		await $(`~${tag}`).setValue(value);
		await $(`~${tag}`).pressKeyCode(66);
	} else {
		await $(`~${tag}`).setValue(`${value}\n`);
	}
};
