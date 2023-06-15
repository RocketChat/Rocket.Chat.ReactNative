import { getRoomIdFromJitsiCallUrl } from './getRoomIdFromJitsiCall';

describe('getRoomIdFromJitsiCallUrl function', () => {
	const urlWithJwt =
		'https://meet.rocketchat.test/rocket6474dd29bbb65c7e344c0da0?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ2aWRlb2NvbmZzcXVhZF9hcHAiLCJzdWIiOiJtZWV0LnJvY2tldGNoYXQuc2hvcCIsImlhdCI6MTY4NTM4NTE3OSwibmJmIjoxNjg1Mzg1MTc5LCJleHAiOjE2ODUzODg3ZXQ2NDc0ZGQyOWJiYjY1YzdlMzQ0YzBkYTAiLCJjb250ZXh0Ijp7InVzZXIiOnsibmFtZSI6InhkYW5pIiwiYXZhdGFyIjoiaHR0cHM6Ly9tb2JpbGUucm9ja2V0LmNoYXQvYXZhdGFyL3hkYW5pIiwiZW1haWwiOiJ1c2VyX2FSdEVMTHJGdkpEQ29USktiQHJvY2tldC5jaGF0In19LCJtb2RlcmF0b3IiOnRydWV9.WCo8Do4m1w8LBg5lVyd7Z-M9dG97uk5ogwfCaBzEUv4#config.desktopSharingChromeExtId="nocfbnnmjnndkbipkabodnheejiegccf"&config.callDisplayName="daniel"&config.startWithAudioMuted=false&config.startWithVideoMuted=true&config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false&config.disableDeepLinking=true';
	const urlWithoutJwt =
		'https://meet.rocketchat.test/rocket6474dd29bbb65c7e344c0da0#config.desktopSharingChromeExtId="nocfbnnmjnndkbipkabodnheejiegccf"&config.callDisplayName="daniel"&config.startWithAudioMuted=false&config.startWithVideoMuted=true&config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false&config.disableDeepLinking=true';

	test('return correct url without jwt', () => {
		const roomId = getRoomIdFromJitsiCallUrl(urlWithoutJwt);
		expect(roomId).toEqual('rocket6474dd29bbb65c7e344c0da0');
	});

	test('return correct url with jwt', () => {
		const roomId = getRoomIdFromJitsiCallUrl(urlWithJwt);
		expect(roomId).toEqual('rocket6474dd29bbb65c7e344c0da0');
	});
});
