# Rocket.Chat Mobile

## E2E Encryption

> Note: This feature is currently in beta. Uploads will not be encrypted in this version.
You can check [this documentation](https://docs.rocket.chat/guides/user-guides/end-to-end-encryption) for further information about the web client.

### How it works

- Each user has a public and private key (asymmetric cryptography).
- The user private key is stored cryptographed on the server and only will be decrypted on clients using the user E2E password.
- User can decrypt the Room key using their private key.
- A Room Key is generated using public key of each participant (symmetric cryptography).
- Each Room Key has a unique identifier that turn users to request a Room Key using it.
- RoomKey identifier is called `e2eKeyId` and is a property of each `room`.
- A Room Key is called `E2EKey` and is a property of each participant `subscription` of a room.
- With the Room Key decrypted, user is able to decrypt and encrypt messages for a Room.

### Encryption

This class provides methods for `encrypt` and `decrypt` messages of *any room*, and is responsible by decrypt and persist the *user keys* _(public and private)_, or create a new one when doesn't exist.
* If the user doesn't have keys stored on server, create new ones and send them back to the server and save locally the password used to encrypt it before send.
* If the user have keys stored on server but doesn't have them stored locally decrypted we should request a password to decrypt the server received private key.
* If the user have keys stored locally them we use it to start the Encryption client.

### Room Encryption

This class provides the capatibilities of `decrypt` and `encrypt` messages of *a room*, and is responsible by decrypt the `E2EKey` _(subscription property)_ using the `user private key`, or create a new one when doesn't exist.
* If the room has a `E2EKey`, we decrypt it using the `user private key` and use the decrypted key to *encrypt/decrypt* messages.
* If the room doesn't have a `E2EKey` but has a `e2eKeyId` we'll *emit an event* on _stream-notify-room-users_ sending the `roomId` and the `e2eKeyId` to request that some online participant of this room provide the `E2EKey` for us.
* If the room doesn't have a `E2EKey` and doesn't have a `e2eKeyId`, we'll create new ones and send them back to the server.

### Mobile specific considerations

* We're always decrypting messages before they are _inserted/updated_ on database, since *watermelonDB* doesn't have triggers.
* We've implemented some _native methods_ to *cast* between the `Web Crypto` key format and the format that should be used on `react-native-simple-crypto`.

#### What we're using

* [RocketChat/react-native-simple-crypto](https://github.com/RocketChat/react-native-simple-crypto)
  - [react-native-randombytes](https://github.com/mvayngrib/react-native-randombytes)
  * iOS
    - [CommonCrypto](https://opensource.apple.com/source/CommonCrypto/)
    - [OpenSSL-Universal](https://cocoapods.org/pods/OpenSSL-Universal)
  * Android
    - [SpongyCastle](https://javadoc.io/doc/com.madgag.spongycastle)
    - [javax.crypto](https://docs.oracle.com/javase/7/docs/api/javax/crypto/package-summary.html)
    - [java.security](https://developers.google.com/j2objc/javadoc/jre/reference/java/security/package-summary)
