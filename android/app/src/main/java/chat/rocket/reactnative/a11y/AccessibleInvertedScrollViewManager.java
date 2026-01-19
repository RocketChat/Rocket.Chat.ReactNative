package chat.rocket.reactnative.a11y;

import android.graphics.Color;
import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.LogicalEdge;
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper;
import com.facebook.react.views.scroll.ScrollEventType;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ViewManager for AccessibleInvertedScrollView.
 * 
 * This manager extends the functionality of ReactScrollViewManager to use
 * AccessibleInvertedScrollView instead, which fixes accessibility traversal
 * order for inverted lists.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@ReactModule(name = AccessibleInvertedScrollViewManager.REACT_CLASS)
public class AccessibleInvertedScrollViewManager extends ViewGroupManager<AccessibleInvertedScrollView>
    implements ReactScrollViewCommandHelper.ScrollCommandHandler<AccessibleInvertedScrollView> {

  public static final String REACT_CLASS = "RCTAccessibleInvertedScrollView";

  private static final int[] SPACING_TYPES = {
    Spacing.ALL, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM,
  };

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public AccessibleInvertedScrollView createViewInstance(ThemedReactContext context) {
    return new AccessibleInvertedScrollView(context, null);
  }

  // Delegate all ReactScrollView props to maintain compatibility
  // Most props are handled by the base ReactScrollView class

  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  public void setScrollEnabled(AccessibleInvertedScrollView view, boolean value) {
    view.setScrollEnabled(value);
    view.setFocusable(value);
  }

  @ReactProp(name = "showsVerticalScrollIndicator", defaultBoolean = true)
  public void setShowsVerticalScrollIndicator(AccessibleInvertedScrollView view, boolean value) {
    view.setVerticalScrollBarEnabled(value);
  }

  @ReactProp(name = "decelerationRate")
  public void setDecelerationRate(AccessibleInvertedScrollView view, float decelerationRate) {
    view.setDecelerationRate(decelerationRate);
  }

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public void setRemoveClippedSubviews(AccessibleInvertedScrollView view, boolean removeClippedSubviews) {
    view.setRemoveClippedSubviews(removeClippedSubviews);
  }

  @ReactProp(name = "pagingEnabled")
  public void setPagingEnabled(AccessibleInvertedScrollView view, boolean pagingEnabled) {
    view.setPagingEnabled(pagingEnabled);
  }

  @ReactProp(name = "nestedScrollEnabled")
  public void setNestedScrollEnabled(AccessibleInvertedScrollView view, boolean value) {
    androidx.core.view.ViewCompat.setNestedScrollingEnabled(view, value);
  }

  @ReactProp(name = "overflow")
  public void setOverflow(AccessibleInvertedScrollView view, @Nullable String overflow) {
    view.setOverflow(overflow);
  }

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public void setPointerEvents(AccessibleInvertedScrollView view, @Nullable String pointerEventsStr) {
    view.setPointerEvents(PointerEvents.parsePointerEvents(pointerEventsStr));
  }

  @ReactProp(name = "scrollEventThrottle")
  public void setScrollEventThrottle(AccessibleInvertedScrollView view, int scrollEventThrottle) {
    view.setScrollEventThrottle(scrollEventThrottle);
  }

  @ReactProp(name = "horizontal")
  public void setHorizontal(AccessibleInvertedScrollView view, boolean horizontal) {
    // Do Nothing: Align with static ViewConfigs
  }

  @Override
  public @Nullable Map<String, Integer> getCommandsMap() {
    return ReactScrollViewCommandHelper.getCommandsMap();
  }

  @Override
  public void receiveCommand(
      AccessibleInvertedScrollView scrollView, int commandId, @Nullable ReadableArray args) {
    ReactScrollViewCommandHelper.receiveCommand(this, scrollView, commandId, args);
  }

  @Override
  public void receiveCommand(
      AccessibleInvertedScrollView scrollView, String commandId, @Nullable ReadableArray args) {
    ReactScrollViewCommandHelper.receiveCommand(this, scrollView, commandId, args);
  }

  @Override
  public void flashScrollIndicators(AccessibleInvertedScrollView scrollView) {
    scrollView.flashScrollIndicators();
  }

  @Override
  public void scrollTo(
      AccessibleInvertedScrollView scrollView, ReactScrollViewCommandHelper.ScrollToCommandData data) {
    scrollView.abortAnimation();
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(data.mDestX, data.mDestY);
    } else {
      scrollView.scrollTo(data.mDestX, data.mDestY);
    }
  }

  @Override
  public void scrollToEnd(
      AccessibleInvertedScrollView scrollView, ReactScrollViewCommandHelper.ScrollToEndCommandData data) {
    View child = scrollView.getChildAt(0);
    if (child == null) {
      throw new RetryableMountingLayerException("scrollToEnd called on ScrollView without child");
    }

    int bottom = child.getHeight() + scrollView.getPaddingBottom();
    scrollView.abortAnimation();
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(scrollView.getScrollX(), bottom);
    } else {
      scrollView.scrollTo(scrollView.getScrollX(), bottom);
    }
  }

  @Override
  public @Nullable Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(createExportedCustomDirectEventTypeConstants());
    return eventTypeConstants;
  }

  public static Map<String, Object> createExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.SCROLL),
            MapBuilder.of("registrationName", "onScroll"))
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.BEGIN_DRAG),
            MapBuilder.of("registrationName", "onScrollBeginDrag"))
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.END_DRAG),
            MapBuilder.of("registrationName", "onScrollEndDrag"))
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.MOMENTUM_BEGIN),
            MapBuilder.of("registrationName", "onMomentumScrollBegin"))
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.MOMENTUM_END),
            MapBuilder.of("registrationName", "onMomentumScrollEnd"))
        .build();
  }
}
