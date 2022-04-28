const { expect } = require('chai');

export const launchApp = async () => await driver.launchApp();

export const setValue = async (tag, value) => await $(`~${tag}`).setValue(`${value}`);

export const getText = async tag => await $(`~${tag}`).getText();

export const equal = async (value, text) => expect(value).to.equal(prop);

export const click = async tag => await $(`~${tag}`).click();

export const clickById = async tag => await $(`id=${tag}`).click();

export const openDrawer = async () =>
	await $('//android.view.ViewGroup[@content-desc="rooms-list-view-sidebar"]/android.widget.TextView').click(); //TEMP

export const clickAlert = async tag => await clickById('android:id/button1');

export const setValueAndEnter = async (tag, value) => {
	if (driver.capabilities.platformName === 'Android') {
		await $(`~${tag}`).click();
		await $(`~${tag}`).setValue(value);
		await $(`~${tag}`).pressKeyCode(66);
	} else {
		await $(`~${tag}`).setValue(`${value} \n`);
	}
};
