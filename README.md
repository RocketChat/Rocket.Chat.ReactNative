# Rocket.Chat Mobile

[![Project Dependencies](https://david-dm.org/RocketChat/Rocket.Chat.ReactNative.svg)](https://david-dm.org/RocketChat/Rocket.Chat.ReactNative)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bb15e2392a71473ea59d3f634f35c54e)](https://www.codacy.com/app/RocketChat/Rocket.Chat.ReactNative?utm_source=github.com&utm_medium=referral&utm_content=RocketChat/Rocket.Chat.ReactNative&utm_campaign=badger)
[![codecov](https://codecov.io/gh/RocketChat/Rocket.Chat.ReactNative/branch/master/graph/badge.svg)](https://codecov.io/gh/RocketChat/Rocket.Chat.ReactNative)
[![CodeFactor](https://www.codefactor.io/repository/github/rocketchat/rocket.chat.reactnative/badge)](https://www.codefactor.io/repository/github/rocketchat/rocket.chat.reactnative)

**Supported Server Versions:** 0.70.0+

## Download

### Official apps
<a href="https://play.google.com/store/apps/details?id=chat.rocket.android">
  <img alt="Download on Google Play" src="https://play.google.com/intl/en_us/badges/images/badge_new.png" height=43>
</a>
<a href="https://apps.apple.com/us/app/rocket-chat/id1148741252">
  <img alt="Download on App Store" src="https://user-images.githubusercontent.com/7317008/43209852-4ca39622-904b-11e8-8ce1-cdc3aee76ae9.png" height=43>
</a>

### Experimental apps
<a href="https://play.google.com/store/apps/details?id=chat.rocket.reactnative">
  <img alt="Download on Google Play" src="https://play.google.com/intl/en_us/badges/images/badge_new.png" height=43>
</a>
<a href="https://itunes.apple.com/us/app/rocket-chat-experimental/id1272915472">
  <img alt="Download on App Store" src="https://user-images.githubusercontent.com/7317008/43209852-4ca39622-904b-11e8-8ce1-cdc3aee76ae9.png" height=43>
</a>

## Beta Access

### TestFlight

You can signup to our TestFlight builds by accessing these links:

- Official: https://testflight.apple.com/join/3gcYeoMr
- Experimental: https://testflight.apple.com/join/7I3dLCNT.

### Google Play beta

You can subscribe to Google Play Beta program and download latest versions:

- Official: https://play.google.com/store/apps/details?id=chat.rocket.android
- Experimental: https://play.google.com/store/apps/details?id=chat.rocket.reactnative

## Reporting an Issue

[Github Issues](https://github.com/RocketChat/Rocket.Chat.ReactNative/issues) are used to track todos, bugs, feature requests, and more.

Also check the [#react-native](https://open.rocket.chat/channel/react-native) community on [open.rocket.chat](https://open.rocket.chat). We'd like to help.

## Installing dependencies

Follow the [React Native Getting Started Guide](https://facebook.github.io/react-native/docs/getting-started.html) for detailed instructions on setting up your local machine for development.

## How to run
- Clone repository and install dependencies:
    ```bash
    $ git clone git@github.com:RocketChat/Rocket.Chat.ReactNative.git
    $ cd Rocket.Chat.ReactNative
    $ yarn
    ```

- Run application
    ```bash
    $ npx react-native run-ios
    ```
    ```bash
    $ npx react-native run-android
    ```

### Running single server
If you don't need multiple servers, there is a branch `single-server` just for that.
Readme will guide you on how to config.

## Current priorities
1) Omnichannel support
2) E2E encryption

## Features
| Feature                                                   	    | Status 	|
|---------------------------------------------------------------	|--------	|
| Jitsi Integration                                             	| ✅    	|
| Federation (Directory)                                        	| ✅    	|
| Discussions                                                     | ✅    	|
| Omnichannel                                                     | ❌    	|
| Threads                                                       	| ✅    	|
| Record Audio                                                  	| ✅    	|
| Record Video                                                  	| ✅    	|
| Commands                                                      	| ✅    	|
| Draft message per room                                        	| ✅    	|
| Share Extension                                               	| ✅    	|
| Notifications Preferences                                     	| ✅    	|
| Edited status                                                 	| ✅    	|
| Upload video                                                  	| ✅    	|
| Grouped messages                                              	| ✅    	|
| Mark room as read                                             	| ✅    	|
| Mark room as unread                                           	| ✅    	|
| Tablet Support                                                	| ✅    	|
| Read receipt                                                  	| ✅    	|
| Broadbast Channel                                             	| ✅    	|
| Authentication via SAML                                       	| ✅    	|
| Authentication via CAS                                        	| ✅    	|
| Custom Fields on Signup                                       	| ✅    	|
| Report message                                                	| ✅    	|
| Theming                                                       	| ✅    	|
| Settings -> Review the App                                    	| ✅    	|
| Settings -> Default Browser                                   	| ✅    	|
| Admin panel                                                   	| ✅    	|
| Reply message from notification                               	| ✅    	|
| Unread counter banner on message list                         	| ✅    	|
| E2E Encryption                                                 	| ❌    	|
| Join a Protected Room                                         	| ❌    	|
| Optional Analytics                                            	| ✅    	|
| Settings -> About us                                          	| ❌    	|
| Settings -> Contact us                                        	| ✅    	|
| Settings -> Update App Icon                                   	| ❌    	|
| Settings -> Share                                             	| ✅    	|
| Accessibility (Medium)                                        	| ❌    	|
| Accessibility (Advanced)                                      	| ❌    	|
| Authentication via Meteor                                     	| ❌    	|
| Authentication via Wordpress                                  	| ✅    	|
| Authentication via Custom OAuth                               	| ✅    	|
| Add user to the room                                          	| ✅    	|
| Send message                                                  	| ✅    	|
| Authentication via Email                                      	| ✅    	|
| Authentication via Username                                   	| ✅    	|
| Authentication via LDAP                                       	| ✅    	|
| Message format: Markdown                                      	| ✅    	|
| Message format: System messages (Welcome, Message removed...) 	| ✅    	|
| Message format: links                                         	| ✅    	|
| Message format: images                                        	| ✅    	|
| Message format: replies                                       	| ✅    	|
| Message format: alias with custom message (title & text)      	| ✅    	|
| Messages list: day separation                                 	| ✅    	|
| Messages list: load more on scroll                            	| ✅    	|
| Messages list: receive new messages via subscription          	| ✅    	|
| Subscriptions list                                            	| ✅    	|
| Segmented subscriptions list: Favorites                       	| ✅    	|
| Segmented subscriptions list: Unreads                         	| ✅    	|
| Segmented subscriptions list: DMs                             	| ✅    	|
| Segmented subscriptions list: Channels                        	| ✅    	|
| Subscriptions list: update user status via subscription       	| ✅    	|
| Numbers os messages unread in the Subscriptions list          	| ✅    	|
| Status change                                                 	| ✅    	|
| Upload image                                                  	| ✅    	|
| Take picture & upload it                                      	| ✅    	|
| 2FA                                                           	| ✅    	|
| Signup                                                        	| ✅    	|
| Autocomplete with usernames                                   	| ✅    	|
| Autocomplete with @all & @here                                	| ✅    	|
| Autocomplete room/channel name                                	| ✅    	|
| Upload audio                                                  	| ✅    	|
| Forgot your password                                          	| ✅    	|
| Login screen: terms of service                                	| ✅    	|
| Login screen: privacy policy                                  	| ✅    	|
| Authentication via Google                                     	| ✅    	|
| Authentication via Facebook                                   	| ✅    	|
| Authentication via Twitter                                    	| ✅    	|
| Authentication via GitHub                                     	| ✅    	|
| Authentication via GitLab                                     	| ✅    	|
| Authentication via LinkedIn                                   	| ✅    	|
| Create channel                                                	| ✅    	|
| Search Local                                                  	| ✅    	|
| Search in the API                                             	| ✅    	|
| Settings -> License                                           	| ✅    	|
| Settings -> App version                                       	| ✅    	|
| Autocomplete emoji                                            	| ✅    	|
| Upload file (documents, PDFs, spreadsheets, zip files, etc)   	| ✅    	|
| Copy message                                                  	| ✅    	|
| Pin message                                                   	| ✅    	|
| Unpin message                                                 	| ✅    	|
| Channel Info screen -> Members                                	| ✅    	|
| Channel Info screen -> Pinned                                 	| ✅    	|
| Channel Info screen -> Starred                                	| ✅    	|
| Channel Info screen -> Uploads                                	| ✅    	|
| Star message                                                  	| ✅    	|
| Unstar message                                                	| ✅    	|
| Channel Info screen -> Topic                                  	| ✅    	|
| Channel Info screen -> Description                            	| ✅    	|
| Star a channel                                                	| ✅    	|
| Message format: videos                                        	| ✅    	|
| Message format: audios                                        	| ✅    	|
| Edit message                                                  	| ✅    	|
| Delete a message                                              	| ✅    	|
| Reply message                                                 	| ✅    	|
| Quote message                                                 	| ✅    	|
| Muted state                                                   	| ✅    	|
| Offline reading                                               	| ✅    	|
| Offline writing                                               	| ✅    	|
| Edit profile                                                  	| ✅    	|
| Reactions                                                     	| ✅    	|
| Custom emojis                                                 	| ✅    	|
| Accessibility (Basic)                                         	| ✅    	|
| Tap notification, go to the channel                           	| ✅    	|
| Deep links: Authentication                                    	| ✅    	|
| Deep links: Rooms                                             	| ✅    	|
| Full name setting                                             	| ✅    	|
| Read only rooms                                               	| ✅    	|
| Typing status                                                 	| ✅    	|
| Create channel/group                                          	| ✅    	|
| Disable registration setting                                  	| ✅    	|
| Unread red line indicator on message list                     	| ✅    	|
| Search Messages in Channel                                    	| ✅    	|
| Mentions List                                                 	| ✅    	|
| Attachment List                                               	| ✅    	|
| Join a Room                                                   	| ✅    	|

## Detox (end-to-end tests)
- Build your app

```bash
$ detox build --configuration ios.sim.release
```

- Run tests

```bash
$ detox test --configuration ios.sim.release
```

## Storybook
- Open index.js

- Uncomment following line

```bash
import './storybook';
```

- Comment out following lines
```bash
import './app/ReactotronConfig';
import { AppRegistry } from 'react-native';
import App from './app/index';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

- Start your application again