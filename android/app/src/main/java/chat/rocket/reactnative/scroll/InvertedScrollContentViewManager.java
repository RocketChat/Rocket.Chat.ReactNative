package chat.rocket.reactnative.scroll;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewManager;

/**
 * View manager for InvertedScrollContentView. Behaves like a View but reports children in reversed
 * order for accessibility so TalkBack matches the visual order in inverted lists.
 */
@ReactModule(name = InvertedScrollContentViewManager.REACT_CLASS)
public class InvertedScrollContentViewManager extends ReactViewManager {

  public static final String REACT_CLASS = "InvertedScrollContentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public InvertedScrollContentView createViewInstance(ThemedReactContext context) {
    return new InvertedScrollContentView(context);
  }
}
