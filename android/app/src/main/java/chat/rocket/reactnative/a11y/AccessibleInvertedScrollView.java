package chat.rocket.reactnative.a11y;

import android.content.Context;
import android.graphics.Rect;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.views.scroll.ReactScrollView;
import com.facebook.react.views.scroll.FpsListener;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;

/**
 * Custom ReactScrollView that fixes accessibility traversal order for inverted lists.
 * 
 * When a FlatList is inverted (inverted={true}), React Native uses scaleY: -1 transform
 * which visually inverts the list but also inverts the accessibility traversal order.
 * This class overrides addChildrenForAccessibility() to maintain correct accessibility
 * order (oldest to newest) despite the visual inversion.
 * 
 * The implementation tracks visible items similar to the useScroll hook in JavaScript,
 * filtering children based on viewport visibility and reordering them for correct
 * accessibility traversal.
 */
public class AccessibleInvertedScrollView extends ReactScrollView {
  
  private static final float VIEWABILITY_THRESHOLD = 0.1f; // 10% visibility threshold
  
  public AccessibleInvertedScrollView(Context context) {
    this(context, null);
  }

  public AccessibleInvertedScrollView(Context context, @Nullable FpsListener fpsListener) {
    super(context, fpsListener);
  }

  /**
   * Override addChildrenForAccessibility to reorder children for correct accessibility traversal.
   * 
   * For inverted lists, the visual order is reversed (newest at top), but we want
   * accessibility to traverse in logical order (oldest to newest). We achieve this by:
   * 1. Getting all visible children based on viewport bounds
   * 2. Sorting them by their position in the view hierarchy (which reflects logical order)
   * 3. Reversing the order so accessibility traverses from bottom to top (oldest to newest)
   * 
   * This method is called by Android's accessibility framework to determine the order
   * in which screen readers should traverse child views.
   */
  @Override
  public void addChildrenForAccessibility(ArrayList<View> outChildren) {
    // Get the content view (the container that holds all list items)
    ViewGroup contentView = (ViewGroup) getContentView();
    if (contentView == null || contentView.getChildCount() == 0) {
      super.addChildrenForAccessibility(outChildren);
      return;
    }

    // Calculate viewport bounds for visibility checking
    int scrollY = getScrollY();
    int paddingTop = getPaddingTop();
    int paddingBottom = getPaddingBottom();
    int viewportTop = scrollY + paddingTop;
    int viewportBottom = scrollY + getHeight() - paddingBottom;
    
    // Collect visible children with their indices
    ArrayList<ViewInfo> visibleChildren = new ArrayList<>();
    
    for (int i = 0; i < contentView.getChildCount(); i++) {
      View child = contentView.getChildAt(i);
      if (child == null || child.getVisibility() != View.VISIBLE) {
        continue;
      }
      
      // Check if child is at least partially visible (using same threshold as useScroll hook)
      if (isChildVisible(child, viewportTop, viewportBottom)) {
        visibleChildren.add(new ViewInfo(child, i, child.getTop()));
      }
    }

    if (visibleChildren.isEmpty()) {
      super.addChildrenForAccessibility(outChildren);
      return;
    }

    // Sort children by their original index in the content view
    // This reflects the logical order (oldest messages have lower indices)
    Collections.sort(visibleChildren, new Comparator<ViewInfo>() {
      @Override
      public int compare(ViewInfo v1, ViewInfo v2) {
        // Sort by original index - lower indices come first (older messages)
        return Integer.compare(v1.originalIndex, v2.originalIndex);
      }
    });

    // For inverted lists, we want accessibility to read from bottom to top
    // (oldest to newest), so we reverse the sorted list
    Collections.reverse(visibleChildren);

    // Add sorted and reversed children to output
    for (ViewInfo viewInfo : visibleChildren) {
      outChildren.add(viewInfo.view);
    }
  }

  /**
   * Helper class to store view information for sorting.
   */
  private static class ViewInfo {
    final View view;
    final int originalIndex;
    final int top;

    ViewInfo(View view, int originalIndex, int top) {
      this.view = view;
      this.originalIndex = originalIndex;
      this.top = top;
    }
  }

  /**
   * Check if a child view is at least partially visible in the viewport.
   * Uses the same threshold as VIEWABILITY_CONFIG (10%).
   * 
   * This matches the logic from useScroll.ts hook which uses
   * itemVisiblePercentThreshold: 10 from VIEWABILITY_CONFIG.
   */
  private boolean isChildVisible(View child, int viewportTop, int viewportBottom) {
    if (child == null || child.getVisibility() != View.VISIBLE) {
      return false;
    }

    int childTop = child.getTop();
    int childBottom = child.getBottom();
    int childHeight = childBottom - childTop;

    if (childHeight == 0) {
      return false;
    }

    // Calculate visible height within viewport
    int visibleTop = Math.max(childTop, viewportTop);
    int visibleBottom = Math.min(childBottom, viewportBottom);
    int visibleHeight = Math.max(0, visibleBottom - visibleTop);

    // Check if at least 10% of the child is visible (matching VIEWABILITY_CONFIG)
    float visibleRatio = (float) visibleHeight / childHeight;
    return visibleRatio >= VIEWABILITY_THRESHOLD;
  }

  /**
   * Get the content view (the container holding list items).
   * ScrollView typically has one child which is the content container.
   */
  @Nullable
  private ViewGroup getContentView() {
    if (getChildCount() > 0) {
      View child = getChildAt(0);
      if (child instanceof ViewGroup) {
        return (ViewGroup) child;
      }
    }
    return null;
  }
}
