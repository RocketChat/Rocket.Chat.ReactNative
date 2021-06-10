const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, mockMessage, tapBack, sleep, searchRoom, starMessage, pinMessage, dismissReviewNag, tryTapping } = require('../../helpers/app');
const { post, get } = require('../../helpers/data_setup');
const deepLink = msg => `https://mobile.rocket.chat/channel/jumpToMessageChatrwurojjluzrbfxyocppa?msg=${msg}`;
let url;

async function navigateToRoom(roomName) {
	await searchRoom(`${ roomName }`);
	await element(by.id(`rooms-list-view-item-${ roomName }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}
describe('Room', () => {
	const mainRoom = `jumpToMessageChat${data.random}`;

	before(async() => {
		for(let x = 1; x <= 200; x++) {
			console.log(`Sending message ${x} to ${mainRoom}`)
			if (x === 30) {
				const { data: { message } } = await post('chat.postMessage', { channel: mainRoom, msg: x });
				url = deepLink(message._id);
			} else if (x === 200) {
				await post('chat.postMessage', { channel: mainRoom, msg: `[](${url}) ${x}` });
			} else {
				await post('chat.postMessage', { channel: mainRoom, msg: x });
			}
			
		 }
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		await navigateToRoom(mainRoom);
	});

	describe('Render room', async() => {
		it('should have room screen', async() => {
			await expect(element(by.id('room-view'))).toExist();
			await waitFor(element(by.id(`room-view-title-${ mainRoom }`))).toExist().withTimeout(5000);
		});

		describe('Header', async() => {
			it('should have actions button ', async() => {
				await expect(element(by.id('room-header'))).toExist();
			});

			it('should have threads button ', async() => {
				await expect(element(by.id('room-view-header-threads'))).toExist();
			});
		});

		describe('Messagebox', async() => {
			it('should have messagebox', async() => {
				await expect(element(by.id('messagebox'))).toExist();
			});
		});
	});

	describe('Load messages on chat', async() => {
		it('should jump to an old message and load its surroundings', async() => {
			await waitFor(element(by.label('200'))).toExist().withTimeout(5000);
			await waitFor(element(by.label('30'))).toExist().withTimeout(5000);
			await element(by.label('30')).tap();
			await waitFor(element(by.label('29'))).toExist().withTimeout(5000);
			await waitFor(element(by.label('31'))).toExist().withTimeout(5000);
			await sleep(3000);
			await waitFor(element(by.id('nav-jump-to-bottom'))).toExist().withTimeout(5000);
			await element(by.id('nav-jump-to-bottom')).tap();
		});

		it('should load messages on scroll', async() => {
			await waitFor(element(by.id('room-view-messages'))).toExist().withTimeout(5000);
			await sleep(5000);
			await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.8);
			await waitFor(element(by.label('160'))).toExist().withTimeout(5000);
		});

		it('should look for old message and load its surroundings', async() => {
			await element(by.id('room-view-search')).tap();
			await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(5000);
			await element(by.id('search-message-view-input')).typeText('30\n');
			await sleep(1000);
			await waitFor(element(by.label('30')).atIndex(0)).toExist().withTimeout(5000);
			await element(by.label('30')).atIndex(1).tap();
			await waitFor(element(by.label('30'))).toExist().withTimeout(6000);
			await waitFor(element(by.label('32'))).toExist().withTimeout(6000);
			await waitFor(element(by.label('31'))).toExist().withTimeout(6000);
			await waitFor(element(by.label('29'))).toExist().withTimeout(6000);
			await waitFor(element(by.label('28'))).toExist().withTimeout(6000);
		})

		it('should load newer and older messages', async() => {
			await sleep(3000);
			await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.8);
			await waitFor(element(by.label('5'))).toExist().withTimeout(5000);
			await waitFor(element(by.label('Load Older'))).toExist().withTimeout(5000);
			await element(by.label('Load Older')).atIndex(0).tap();
			await waitFor(element(by.label('4'))).toExist().withTimeout(5000);
			await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.5);
			await waitFor(element(by.label('1'))).toExist().withTimeout(5000);
			await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'fast', 0.5);
			await waitFor(element(by.label('25'))).toExist().withTimeout(5000);
			await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'fast', 0.5);
			await waitFor(element(by.label('50'))).toExist().withTimeout(5000);
			await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'slow', 0.5);
			await waitFor(element(by.label('Load Newer'))).toExist().withTimeout(5000);
			await element(by.label('Load Newer')).atIndex(0).tap();
			await waitFor(element(by.label('98'))).toExist().withTimeout(5000);
			await waitFor(element(by.label('99'))).toExist().withTimeout(5000);
			await waitFor(element(by.label('100'))).toExist().withTimeout(5000);
		});
	});

	describe('Jump to message on chat', async() => {

		it('should jump from search message', async() => {
			await element(by.id('room-view-search')).tap();
			await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(5000);
			await element(by.id('search-message-view-input')).typeText('2\n');
			await sleep(1000);
			await waitFor(element(by.label('2')).atIndex(0)).toExist().withTimeout(5000);
		});

		it('should quote an old message from the chat', async() => {
			await element(by.label('2')).atIndex(1).tap();
			await waitFor(element(by.label('2')).atIndex(1)).toExist().withTimeout(10000);
			await sleep(14000);
			await element(by.label('2')).atIndex(1).longPress();
			await waitFor(element(by.label('Quote')).atIndex(0)).toExist().withTimeout(5000);
			await element(by.label('Quote')).atIndex(0).tap();
			await element(by.id('messagebox-input')).tap();
			await element(by.id('messagebox-input')).typeText(`${ data.random }response`);
			await element(by.id('messagebox-send-message')).tap();
			await waitFor(element(by.id('nav-jump-to-bottom'))).toExist().withTimeout(5000);
			await element(by.id('nav-jump-to-bottom')).tap();
		})

		it('should jump to message', async() => {
			await waitFor(element(by.label(`${data.random}response`))).toExist().withTimeout(15000);
			await waitFor(element(by.label('2')).atIndex(1)).toExist().withTimeout(5000);
			await element(by.label('2')).atIndex(0).tap();
			await waitFor(element(by.label('2'))).toExist().withTimeout(5000);
			await waitFor(element(by.label('3'))).toExist().withTimeout(5000);
			
		});

		it('should jump to another chat with deep linking', async() => {
			await sleep(6000);
			await tapBack();
			await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(5000);
			await waitFor(element(by.id(`rooms-list-view-item-${ data.groups.private.name }`))).toExist().withTimeout(5000);
			await element(by.id(`rooms-list-view-item-${ data.groups.private.name }`)).tap();
			await waitFor(element(by.id('messagebox-input'))).toBeVisible().withTimeout(5000);
			await element(by.id('messagebox-input')).tap();
			await element(by.id('messagebox-input')).replaceText(url);
			await element(by.id('messagebox-send-message')).tap();
			await waitFor(element(by.label(url)).atIndex(0)).toExist().withTimeout(8000);
			await element(by.label(url)).atIndex(0).tap();
			await waitFor(element(by.label('30'))).toExist().withTimeout(10000);
		})
	});
});

describe('Threads', async() => {
	const threadRoom = `jumpToMessageThreads${data.random}`;
	before(async() => {
		const { data: { message } } = await post('chat.postMessage', { channel: threadRoom, msg: 'Sample message for thread' });
		const { data: { channel } } = await get(`channels.info?roomName=${threadRoom}`);
		for(let x = 1; x <= 200; x++) {
			console.log(`Sending message ${x} to thread in ${threadRoom}`);
			if (x === 30) {
				const result = await post('chat.postMessage', {
					tmid: message._id,
					text: x,
					roomId: channel._id,
				});
				url = deepLink(result.data?.message._id);
			} else if (x === 200) {
				await post('chat.postMessage', {
					tmid: message._id,
					text: `[](${url}) ${x}`,
					roomId: channel._id,
				});
			} else {
				await post('chat.postMessage', {
					tmid: message._id,
					text: x,
					roomId: channel._id,
				});
			}
		}
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		await navigateToRoom(threadRoom);
	});

	describe('Load messages on chat', async() => {
		it('should jump to an old message and load its surroundings', async() => {
			await waitFor(element(by.label('Sample message for thread'))).toExist().withTimeout(5000);
			await sleep(5000); 
			// we should change this once we come up with a fix
			await waitFor(element(by.label('Load More')).atIndex(0)).toExist().withTimeout(8000);
			await element(by.label('Load More')).atIndex(0).tap();
			await waitFor(element(by.label('Load More')).atIndex(0)).toExist().withTimeout(8000);
			await element(by.label('Load More')).atIndex(0).tap();
			await waitFor(element(by.label('Load More')).atIndex(0)).toExist().withTimeout(8000);
			await element(by.label('Load More')).atIndex(0).tap();
			await waitFor(element(by.label('Load More')).atIndex(0)).toExist().withTimeout(8000);
			await element(by.label('Load More')).atIndex(0).tap();
			await waitFor(element(by.label('Reply')).atIndex(0)).toExist().withTimeout(5000);
			await element(by.label('Reply')).atIndex(0).tap();
			await waitFor(element(by.label('200'))).toExist().withTimeout(5000);
			await waitFor(element(by.label('30'))).toExist().withTimeout(5000);
			await element(by.label('30')).tap();
			await waitFor(element(by.label('29'))).toExist().withTimeout(8000);
			await waitFor(element(by.label('31'))).toExist().withTimeout(8000);
			await sleep(3000);
			await waitFor(element(by.id('nav-jump-to-bottom'))).toExist().withTimeout(5000);
			await element(by.id('nav-jump-to-bottom')).tap();
		});

		it('should load messages on scroll', async() => {
			await waitFor(element(by.id('room-view'))).toExist().withTimeout(5000);
			await sleep(5000);
			await element(by.id('room-view-messages')).atIndex(1).swipe('down', 'fast', 0.8);
			await waitFor(element(by.label('160'))).toExist().withTimeout(5000);
		});

		it('should look for old message and load its surroundings', async() => {
			await tapBack();
			await element(by.id('room-view-search')).tap();
			await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(5000);
			await element(by.id('search-message-view-input')).typeText('30\n');
			await sleep(1000);
			await waitFor(element(by.label('30')).atIndex(0)).toExist().withTimeout(8000);
			await element(by.label('30')).atIndex(1).tap();
			await waitFor(element(by.label('30'))).toExist().withTimeout(10000);
			await waitFor(element(by.label('32'))).toExist().withTimeout(6000);
			await waitFor(element(by.label('31'))).toExist().withTimeout(6000);
			await waitFor(element(by.label('29'))).toExist().withTimeout(6000);
			await waitFor(element(by.label('28'))).toExist().withTimeout(6000);
		})
	});

	describe('Jump to message on threads', async() => {
		it('should jump from search message', async() => {
			await tapBack();
			await element(by.id('room-view-search')).tap();
			await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(5000);
			await element(by.id('search-message-view-input')).typeText('2\n');
			await sleep(1000);
			await waitFor(element(by.label('2')).atIndex(0)).toExist().withTimeout(10000);
		});
	
		it('should quote an old message from the chat', async() => {
			await element(by.label('2')).atIndex(1).tap();
			await waitFor(element(by.label('2')).atIndex(1)).toExist().withTimeout(10000);
			await sleep(15000);
			await element(by.label('2')).atIndex(1).longPress();
			await waitFor(element(by.label('Quote')).atIndex(0)).toExist().withTimeout(5000);
			await element(by.label('Quote')).atIndex(0).tap();
			await element(by.id('messagebox-input-thread')).tap();
			await element(by.id('messagebox-input-thread')).typeText(`${ data.random }response`);
			await element(by.id('messagebox-send-message')).tap();
			await waitFor(element(by.id('nav-jump-to-bottom'))).toExist().withTimeout(5000);
			await element(by.id('nav-jump-to-bottom')).tap();
		})
	
		it('should jump to message', async() => {
			await waitFor(element(by.label(`${data.random}response`))).toExist().withTimeout(15000);
			await waitFor(element(by.label('2')).atIndex(1)).toExist().withTimeout(5000);
			await element(by.label('2')).atIndex(0).tap();
			await waitFor(element(by.label('2'))).toExist().withTimeout(5000);
			await waitFor(element(by.label('3'))).toExist().withTimeout(5000);
		});
	
		it('should jump to another chat with deep linking', async() => {
			await sleep(6000);
			await tapBack();
			await tapBack();
			await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(5000);
			await waitFor(element(by.id(`rooms-list-view-item-${ data.groups.private.name }`))).toExist().withTimeout(5000);
			await element(by.id(`rooms-list-view-item-${ data.groups.private.name }`)).tap();
			await waitFor(element(by.id('messagebox-input'))).toBeVisible().withTimeout(5000);
			await element(by.id('messagebox-input')).tap();
			await element(by.id('messagebox-input')).replaceText(url);
			await element(by.id('messagebox-send-message')).tap();
			await waitFor(element(by.label(url)).atIndex(0)).toExist().withTimeout(8000);
			await element(by.label(url)).atIndex(0).tap();
			await waitFor(element(by.label('30'))).toExist().withTimeout(10000);
		});
	});
});