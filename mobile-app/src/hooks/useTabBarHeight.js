import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Returns the correct bottom padding to add to a ScrollView's
 * contentContainerStyle so content is never hidden behind the tab bar
 * or the Android gesture / 3-button navigation bar.
 *
 * We add a small extra buffer so the last card is never flush against the tab bar.
 */
export function useScrollPaddingBottom() {
  const insets = useSafeAreaInsets();
  // Tab bar height (82 + insets.bottom) + 16 buffer
  return 98 + insets.bottom;
}

/**
 * Returns the total height the tab bar occupies at the bottom of the screen,
 * useful for absolutely-positioned elements that need to sit above the tab bar.
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  // Tab bar height (82 + insets.bottom)
  return 82 + insets.bottom;
}
