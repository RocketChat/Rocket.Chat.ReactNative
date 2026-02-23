import ensureSecureProtocol from './ensureSecureProtocol';

describe('Add the protocol https at the begin of the URL', () => {
	it('return the link as original when sent with https at the begin', () => {
		const linkHttps = 'https://www.google.com';
		expect(ensureSecureProtocol(linkHttps)).toBe(linkHttps);
	});
	it('return the link as original when sent with http at the begin', () => {
		const linkHttp = 'http://www.google.com';
		expect(ensureSecureProtocol(linkHttp)).toBe(linkHttp);
	});
	it("return a new link with protocol at the begin when there isn't the protocol at the begin", () => {
		const linkWithoutProtocol = 'www.google.com';
		expect(ensureSecureProtocol(linkWithoutProtocol)).toBe('https://www.google.com');
	});
	it('return the link correctly when the original starts with double slash, because the server is returning that', () => {
		const linkWithDoubleSlashAtBegin = '//www.google.com';
		expect(ensureSecureProtocol(linkWithDoubleSlashAtBegin)).toBe('https://www.google.com');
	});
	it('return the link as original when sent with rocketchat protocol', () => {
		const linkRocketChat = 'rocketchat://www.google.com';
		expect(ensureSecureProtocol(linkRocketChat)).toBe(linkRocketChat);
	});
	it('return the link as original when sent with ftp protocol', () => {
		const linkFtp = 'ftp://ftp.example.com';
		expect(ensureSecureProtocol(linkFtp)).toBe(linkFtp);
	});
	it('return the link as original when sent with mailto protocol', () => {
		const linkMailto = 'mailto:user@example.com';
		expect(ensureSecureProtocol(linkMailto)).toBe(linkMailto);
	});
	it('return the link as original when sent with tel protocol', () => {
		const linkTel = 'tel:+1234567890';
		expect(ensureSecureProtocol(linkTel)).toBe(linkTel);
	});
	it('return the link as original when sent with custom protocol containing numbers', () => {
		const linkCustom = 'app1://example.com';
		expect(ensureSecureProtocol(linkCustom)).toBe(linkCustom);
	});
	it('return the link as original when sent with file protocol', () => {
		const linkFile = 'file:///path/to/file.txt';
		expect(ensureSecureProtocol(linkFile)).toBe(linkFile);
	});
	it('return the link as original when sent with data protocol', () => {
		const linkData = 'data:text/plain;base64,SGVsbG8=';
		expect(ensureSecureProtocol(linkData)).toBe(linkData);
	});
	it('return the link as original when sent with ws protocol', () => {
		const linkWs = 'ws://example.com/socket';
		expect(ensureSecureProtocol(linkWs)).toBe(linkWs);
	});
	it('return the link as original when sent with wss protocol', () => {
		const linkWss = 'wss://example.com/socket';
		expect(ensureSecureProtocol(linkWss)).toBe(linkWss);
	});
});
