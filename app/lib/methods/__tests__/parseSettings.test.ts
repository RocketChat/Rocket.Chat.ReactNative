import { parseSettings } from '../parseSettings';

describe('parseSettings', () => {
	it('maps each setting id to the value of its declared type', () => {
		const settings = [
			{ _id: 'Site_Name', valueAsString: 'Rocket.Chat' },
			{ _id: 'UI_Use_Real_Name', valueAsBoolean: true }
		];

		expect(parseSettings(settings)).toEqual({ Site_Name: 'Rocket.Chat', UI_Use_Real_Name: true });
	});

	it('leaves settings without a default undefined', () => {
		expect(parseSettings([{ _id: 'Unknown_Setting', valueAsString: 'x' }])).toEqual({ Unknown_Setting: undefined });
	});

	it('expands mute_unmute in Hide_System_Messages and keeps the order', () => {
		const settings = [{ _id: 'Hide_System_Messages', valueAsArray: ['uj', 'mute_unmute', 'ul'] }];

		expect(parseSettings(settings)).toEqual({ Hide_System_Messages: ['uj', 'user-muted', 'user-unmuted', 'ul'] });
	});
});
