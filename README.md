# Rocket.Chat React Native Mobile

[![Greenkeeper badge](https://badges.greenkeeper.io/RocketChat/Rocket.Chat.ReactNative.svg)](https://greenkeeper.io/)
[![Build Status](https://img.shields.io/travis/RocketChat/Rocket.Chat.ReactNative/master.svg)](https://travis-ci.org/RocketChat/Rocket.Chat.ReactNative)
[![Project Dependencies](https://david-dm.org/RocketChat/Rocket.Chat.ReactNative.svg)](https://david-dm.org/RocketChat/Rocket.Chat.ReactNative)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bb15e2392a71473ea59d3f634f35c54e)](https://www.codacy.com/app/RocketChat/Rocket.Chat.ReactNative?utm_source=github.com&utm_medium=referral&utm_content=RocketChat/Rocket.Chat.ReactNative&utm_campaign=badger)
[![codecov](https://codecov.io/gh/RocketChat/Rocket.Chat.ReactNative/branch/master/graph/badge.svg)](https://codecov.io/gh/RocketChat/Rocket.Chat.ReactNative)
[![CodeFactor](https://www.codefactor.io/repository/github/rocketchat/rocket.chat.reactnative/badge)](https://www.codefactor.io/repository/github/rocketchat/rocket.chat.reactnative)
[![Known Vulnerabilities](https://snyk.io/test/github/rocketchat/rocket.chat.reactnative/badge.svg)](https://snyk.io/test/github/rocketchat/rocket.chat.reactnative)

**Supported Server Versions:** 0.58.0+ (We are working to support earlier versions)

## Download
[![Rocket.Chat.ReactNative on Google Play](https://play.google.com/intl/en_us/badges/images/badge_new.png)](https://play.google.com/store/apps/details?id=chat.rocket.reactnative)

Note: If you want to try iOS version, send us an email to testflight@rocket.chat and we'll add you to TestFlight users.


## Installing dependencies

Follow the [React Native Getting Started Guide](https://facebook.github.io/react-native/docs/getting-started.html) for detailed instructions on setting up your local machine for development.

## How to run
- Clone repository and install dependencies:
    ```bash
    $ git clone git@github.com:RocketChat/Rocket.Chat.ReactNative.git
    $ cd Rocket.Chat.ReactNative
    $ npm install -g react-native-cli
    $ npm install
    ```
- Configuration
	```bash
    $ npm run fabric-ios --key="YOUR_API_KEY" --secret="YOUR_API_SECRET"
    $ npm run fabric-android --key="YOUR_API_KEY" --secret="YOUR_API_SECRET"
    ```

- Run application
    ```bash
    $ npm run ios
    ```
    ```bash
    $ npm run android
    ```

### Running single server
If you don't need multiple servers, there is a branch `single-server` just for that.
Readme will guide you on how to config.

## Roadmap

### Current priorities

1) Open PDF and other file types ([#341][i341])
2) [NEW] Commands ([#405][i405])
3) Better message actions ([#329][i329])
4) [NEW] Login/Register/Forgot Password layout ([#400][i400])

### To do
|    Task              | Status |
|--------------------|-----|
| [NEW] Reply Preview ([#311][i311]) |  ✅  |
| Image upload improvements ([#368][i368]) |  ✅  |
| [NEW] Onboarding ([#392][i392])             |    ✅  |
| [NEW] Create channel layout ([#401][i401])             |    ✅  |
| [NEW] Splash screen ([#399][i399])             |    ✅  |
| [NEW] Add empty chat background ([#398][i398])             |    ✅  |
| [NEW] Message layout ([#397][i397])             |    ✅  |
| [NEW] Rooms list layout ([#395][i395])             |    ✅  |
| Add components to Storybook ([#38][i38])            |    WIP  |
| Open PDF and other file types ([#341][i341])            |    WIP  |
| Better message actions ([#329][i329])             |    ❌  |
| [NEW] Settings layout ([#396][i396])             |    ❌  |
| [NEW] Contextual bar layout ([#402][i402])             |    ❌  |
| [NEW] Login/Register/Forgot Password layout ([#400][i400])             |    ❌  |
| [NEW] Commands ([#405][i405])   |  ❌  |
| [Android] Add Fastlane ([#404][i404]) |   ❌   |
| [NEW] Auto versioning app on Circle CI ([#393][i393])             |    ❌  |
| [Android] Group notifications by room ([#391][i391])             |    ❌  |
| Integrate project with code push ([#233][i233])           |    ❌  |
| Custom icons ([#210][i210])             |    ❌  |
| Share Extension ([#69][i69])          |    ❌  |
| Upload files ([#2][i2])             |    ❌  |

[i2]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/2
[i38]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/38
[i69]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/69
[i210]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/210
[i233]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/233
[i329]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/329
[i341]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/341
[i391]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/391
[i393]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/393
[i403]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/403
[i404]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/404
[i405]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/405
[i395]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/395
[i396]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/396
[i397]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/397
[i398]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/398
[i399]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/399
[i400]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/400
[i401]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/401
[i402]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/402
[i392]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/392
[i368]: https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/368
[i311]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/311

## Features
| Feature                                                           | Status             |
|-----------------------------------------------------------------  |----------------    |
| Send message                                                  	| ✅             	|
| Authentication via Email                                      	| ✅             	|
| Authentication via Username                                   	| ✅             	|
| Authentication via LDAP                                       	| ✅             	|
| Message format: Markdown                                      	| ✅             	|
| Message format: System messages (Welcome, Message removed...) 	| ✅             	|
| Message format: links                                         	| ✅             	|
| Message format: images                                        	| ✅             	|
| Message format: replies                                       	| ✅             	|
| Message format: alias with custom message (title & text)      	| ✅             	|
| Messages list: day separation                                 	| ✅             	|
| Messages list: load more on scroll                            	| ✅             	|
| Messages list: receive new messages via subscription          	| ✅             	|
| Subscriptions list                                            	| ✅             	|
| Segmented subscriptions list: Favorites                       	|  ✅            	|
| Segmented subscriptions list: Unreads                         	|  ✅            	|
| Segmented subscriptions list: DMs                             	|  ✅            	|
| Segmented subscriptions list: Channels                        	|  ✅            	|
| Subscriptions list: update user status via subscription       	| ✅             	|
| Numbers os messages unread in the Subscriptions list          	| ✅             	|
| Status change                                                 	| ✅             	|
| Upload image                                                  	| ✅             	|
| Upload video                                                  	|  ❌            	|
| Take picture & upload it                                      	| ✅             	|
| 2FA                                                           	| ✅             	|
| Signup                                                        	| ✅             	|
| Autocomplete with usernames                                   	| ✅             	|
| Autocomplete with @all & @here                                	| ✅             	|
| Autocomplete room/channel name                                	| ✅             	|
| Upload audio                                                  	| ✅             	|
| Forgot your password                                          	| ✅             	|
| Login screen: terms of service                                	| ✅             	|
| Login screen: privacy policy                                  	| ✅             	|
| Authentication via Google                                     	| ✅             	|
| Authentication via Facebook                                   	| ✅             	|
| Authentication via Twitter                                    	| ✅             	|
| Authentication via GitHub                                     	| ✅             	|
| Authentication via GitLab                                     	| ✅             	|
| Authentication via LinkedIn                                   	| ✅             	|
| Authentication via Meteor                                     	| ✅ 	            |
| Authentication via Wordpress                                  	|  ❌            	|
| Authentication via Custom OAuth                               	|  ❌            	|
| Authentication via SAML                                       	|  ❌            	|
| Authentication via CAS                                        	|  ❌            	|
| Custom Fields on Signup                                       	|  ❌            	|
| Create channel                                                	| ✅             	|
| Search Local                                                  	| ✅             	|
| Search in the API                                             	| ✅             	|
| Settings -> About us                                          	|  ❌            	|
| Settings -> Contact us                                        	|  ❌            	|
| Settings -> License                                           	|  ❌            	|
| Settings -> App version                                       	|  ❌            	|
| Autocomplete emoji                                            	| ✅             	|
| Upload file (documents, PDFs, spreadsheets, zip files, etc)   	| ✅             	|
| Report message                                                	|  ❌            	|
| Copy message                                                  	| ✅             	|
| Pin message                                                   	| ✅             	|
| Unpin message                                                 	| ✅             	|
| Channel Info screen -> Members                                	| ✅             	|
| Channel Info screen -> Pinned                                 	| ✅             	|
| Channel Info screen -> Starred                                	| ✅             	|
| Channel Info screen -> Uploads                                	| ✅            	    |
| Star message                                                  	| ✅             	|
| Unstar message                                                	| ✅             	|
| Channel Info screen -> Topic                                  	| ✅             	|
| Channel Info screen -> Description                            	| ✅             	|
| Star a channel                                                	| ✅             	|
| Message format: videos                                        	| ✅             	|
| Message format: audios                                        	| ✅             	|
| Block user (local only)                                       	| ✅             	|
| Edit message                                                  	| ✅             	|
| Delete a message                                              	| ✅             	|
| Reply message                                                 	| ✅             	|
| Quote message                                                 	| ✅             	|
| Record Audio                                                  	| ✅             	|
| Record Video                                                  	|  ❌            	|
| Muted state                                                   	| ✅             	|
| Admin panel                                                   	|  ❌            	|
| Offline reading                                               	| ✅             	|
| Offline writing                                               	|  ❌            	|
| Edit profile                                                  	| ✅             	|
| Reactions                                                     	| ✅             	|
| Custom emojis                                                 	| ✅             	|
| Commands                                                      	|  ❌            	|
| Accessibility (Basic)                                         	| ✅             	|
| Accessibility (Medium)                                        	|  ❌            	|
| Accessibility (Advanced)                                      	|  ❌            	|
| Reply message from notification                               	|  ❌            	|
| Tap notification, go to the channel                           	| ✅             	|
| Deep links: Authentication                                    	| ✅             	|
| Deep links: Rooms                                             	| ✅             	|
| Draft per room                                                	|  ❌            	|
| Localized in Portuguese (pt-BR)                               	| ✅             	|
| Localized in Russian                                          	| ✅             	|
| Localized in English                                          	| ✅                 |
| Full name setting                                             	|  ✅            	|
| Read only rooms                                               	| ✅             	|
| Typing status                                                 	| ✅             	|
| Create channel/group                                          	| ✅             	|
| Disable registration setting                                  	| ✅             	|
| Unread red line indicator on message list                     	| ✅             	|
| Unread counter banner on message list                         	| ✅             	|
| Share Extension                                               	|  ❌            	|
| Search Messages in Channel                                    	| ✅             	|
| Mentions List                                                 	| ✅             	|
| Attachment List                                               	| ✅             	|
| Notifications Preferences                                     	| ✅             	|
| Read receipt                                                  	|  ❌            	|

## Detox (end-to-end tests)
- Build your app

```bash
$ detox build
```

- Run tests

```bash
$ detox test
```

## Storybook
- General requirements
    - Install storybook
        ```bash
        $ npm i -g @storybook/cli
        ```

- Running storybook
    - Run storybook application
        ```bash
        $ npm run storybook
        ```
    - Run application in other shell
        ```bash
        $ react-native run-ios
        ```
    - Running storybook on browser to help stories navigation
        ```
        open http://localhost:7007/
        ```
