# FlashList migration

The rooms list (`RoomsListView`) uses `@shopify/flash-list` instead of `FlatList` for better performance on Android.

The room message list (`RoomView`) continues to use `Animated.FlatList` because it relies on the `inverted` prop and `onScrollToIndexFailed` which are not supported by FlashList v2.

## Comparing CPU usage (Android)

On a physical device with the app installed:

1. Reset and capture baseline (optional, if comparing two builds):
   ```bash
   adb shell dumpsys gfxinfo chat.rocket.reactnative reset
   ```
2. Use the app (scroll rooms list, open a room, scroll messages, receive messages, jump to message, scroll to bottom).
3. Dump CPU and graphics stats:
   ```bash
   adb shell dumpsys cpuinfo | grep -E "chat.rocket|Total"
   adb shell dumpsys gfxinfo chat.rocket.reactnative
   ```
4. From `gfxinfo` compare:
   - **Janky frames** (lower is better)
   - **50th / 90th / 95th / 99th percentile** frame times (lower is better)
   - **Number Slow UI thread** (lower is better)

Run the same flow on the same device for a pre-migration build and the FlashList build, then compare the numbers.
