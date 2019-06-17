const {
	device, element, by
} = require('detox');

async function searchRoom(query = '') {
    if (device.getPlatform() === 'android') {
        await element(by.id('rooms-list-view-search')).tap();
        await element(by.id('rooms-list-view-search-input')).replaceText(query);
    } else {
        await element(by.id('rooms-list-view-search')).replaceText(query);
    }
}

module.exports = {
    searchRoom
};