package chat.rocket.reactnative.scroll;

import androidx.annotation.Nullable;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.scroll.ReactScrollViewManager;

@ReactModule(name = VisualOrderScrollViewManager.REACT_CLASS)
public class VisualOrderScrollViewManager extends ReactScrollViewManager {

  public static final String REACT_CLASS = "VisualOrderScrollView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public VisualOrderScrollView createViewInstance(ThemedReactContext context) {
    return new VisualOrderScrollView(context);
  }

  @ReactProp(name = "exitFocusNativeId")
  public void setExitFocusNativeId(VisualOrderScrollView view, @Nullable String nativeId) {
    view.setExitFocusNativeId(nativeId);
  }
}
