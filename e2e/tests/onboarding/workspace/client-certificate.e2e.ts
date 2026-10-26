import { afterAll, afterEach, beforeAll, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers, sendMessage as sendMessageFromServer } from '~e2e/support/api';
import {
	chooseClientCertificate,
	createClientCertificate,
	installClientCertificate,
	removeClientCertificateFiles,
	startClientCertificateProxy,
	trustCertificateAuthority,
	type ClientCertificate,
	type ClientCertificateProxy
} from '~e2e/support/clientCertificate';
import { fillWhenUncovered, launchApp, loginWithForm, LONG_TIMEOUT, navigateToRoom, sendMessage } from '~e2e/support/flows';
import { random } from '~e2e/support/random';

let certificate: ClientCertificate;
let proxy: ClientCertificateProxy;

beforeAll(async () => {
	certificate = await createClientCertificate();
	proxy = await startClientCertificateProxy(certificate);
});

afterAll(() => proxy.close());

afterEach(deleteCreatedUsers);

afterEach(fixtures => removeClientCertificateFiles(fixtures, certificate));

test('connects to a workspace that requires a client certificate', { tags: ['test-1'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);
	await trustCertificateAuthority(fixtures, certificate);
	await launchApp(fixtures);
	await installClientCertificate(fixtures, certificate);

	await fillWhenUncovered(screen.getByTestId('new-server-view-input'), proxy.url(fixtures.platform));
	await screen.getByText('Connect').tap();
	await expect(screen.getByText('Invalid URL')).toBeVisible({ timeout: LONG_TIMEOUT });

	await chooseClientCertificate(fixtures, certificate);
	await screen.getByText('Connect').tap();
	await expect(screen.getByTestId('workspace-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Login').tap();
	await expect(screen.getByTestId('login-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await loginWithForm(fixtures, user);

	await navigateToRoom(fixtures, room.name);
	await sendMessage(fixtures, `sent through mtls ${random()}`);
	const received = `received through mtls ${random()}`;
	await sendMessageFromServer(user, room.name, received);
	await expect(screen.getByTestId(`message-content-${received}`)).toBeVisible({ timeout: LONG_TIMEOUT });
});
