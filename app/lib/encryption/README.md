# Rocket.Chat Mobile

## E2E Encryption

> Note: This feature is currently in beta. Uploads will not be encrypted in this version.
You can check [this documentation](https://docs.rocket.chat/guides/user-guides/end-to-end-encryption) for further information about the web client.

### How it works

- Each user has a public and private key (asymmetric cryptography).
- The user private key is stored encrypted on the server and it can be decrypted on clients only using the user E2E encryption password.
- A room key is generated using the public key of each room member (symmetric cryptography).
- Users can decrypt the room key using their private key.
- Each room has a unique identifier which make users able to request a room key.
- The room unique identifier is called `e2eKeyId` and it's a property of the `room` collection.
- The room key is called `E2EKey` and it's a property of the `subscription` collection.
- After the room key is decrypted, the user is able to encrypt and decrypt messages of the room.

### User keys

* If the user doesn't have keys neither locally nor on the server, we create and encrypt them using a random password. These encrypted keys are sent to the server (so other clients can fetch) and saved locally.
* If the user have keys stored on server, but doesn't have them stored locally, we fetch them from the server and request a password to decrypt the keys.

### Room keys

* If the room has a `E2EKey`, we decrypt it using the user key.
* If the room doesn't have a `E2EKey`, but has a `e2eKeyId`, we *emit an event* on _stream-notify-room-users_ sending the `roomId` and the `e2eKeyId` requesting the `E2EKey` from any online room member.
* If the room have none of them, we create new ones and send them back to the server.
