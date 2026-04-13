package chat.rocket.reactnative.a11y;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.util.concurrent.atomic.AtomicReference;

@ReactModule(name = KeyboardA11ySpec.NAME)
public class KeyboardA11yModule extends KeyboardA11ySpec {

  private static final class State {
    final boolean enabled;
    @Nullable final String scope;

    State(boolean enabled, @Nullable String scope) {
      this.enabled = enabled;
      this.scope = scope;
    }
  }

  private static final AtomicReference<State> sState =
      new AtomicReference<>(new State(false, null));

  public KeyboardA11yModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  public static boolean isEnabled() {
    return sState.get().enabled;
  }

  @Nullable
  public static String getScope() {
    return sState.get().scope;
  }

  @Override
  public void enable(String scope) {
    sState.set(new State(true, scope));
  }

  @Override
  public void disable() {
    sState.set(new State(false, null));
  }

  @Override
  public void getState(Promise promise) {
    State snapshot = sState.get();
    WritableMap state = com.facebook.react.bridge.Arguments.createMap();
    state.putBoolean("enabled", snapshot.enabled);
    state.putString("scope", snapshot.scope);
    promise.resolve(state);
  }
}
