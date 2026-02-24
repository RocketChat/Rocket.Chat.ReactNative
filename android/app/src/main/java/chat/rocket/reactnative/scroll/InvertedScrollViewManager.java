package chat.rocket.reactnative.scroll;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.scroll.ReactScrollViewManager;

/**
 * View manager for {@link InvertedScrollView}. Registers as "InvertedScrollView" to avoid
 * collision with core RCTScrollView. Inherits all ScrollView props from ReactScrollViewManager;
 * FlatList passes isInvertedVirtualizedList when inverted, which is applied by the parent setter.
 */
@ReactModule(name = InvertedScrollViewManager.REACT_CLASS)
public class InvertedScrollViewManager extends ReactScrollViewManager {

  public static final String REACT_CLASS = "InvertedScrollView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public InvertedScrollView createViewInstance(ThemedReactContext context) {
    return new InvertedScrollView(context);
  }
}
