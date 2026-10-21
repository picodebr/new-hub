import * as Blockly from 'blockly/core';

interface WorkspaceWithToolbox extends Blockly.WorkspaceSvg {
  getToolbox(): Blockly.IToolbox;
  getFlyoutScale?: () => number;
}

interface FlyoutWithScrollbar extends Blockly.IFlyout {
  setVisible: (visible: boolean) => void;
  scrollbar_?: {
    svgGroup_?: SVGElement;
  };
  getFlyoutScale?: () => number;
}

/**
 * Patches the Flyout scrollbar to properly hide when the flyout is not visible.
 */
export const patchFlyoutScrollbars = (workspace: Blockly.WorkspaceSvg) => {
  const ws = workspace as unknown as WorkspaceWithToolbox;
  const flyout = ws.getFlyout() || ws.getToolbox()?.getFlyout();
  if (flyout) {
    const flyoutWithScroll = flyout as unknown as FlyoutWithScrollbar;
    const originalSetVisible = flyoutWithScroll.setVisible;
    flyoutWithScroll.setVisible = function (this: FlyoutWithScrollbar, visible: boolean) {
      originalSetVisible.call(this, visible);
      const domScrollbars = document.querySelectorAll('.blocklyFlyoutScrollbar');
      domScrollbars.forEach((el) => {
        (el as HTMLElement).style.display = visible ? '' : 'none';
      });
      if (this.scrollbar_ && this.scrollbar_.svgGroup_) {
        this.scrollbar_.svgGroup_.style.display = visible ? 'block' : 'none';
      }
    };
  }
};

/**
 * Applies a consistent scale to the flyout and its contents.
 */
export const applyFlyoutScaling = (workspace: Blockly.WorkspaceSvg) => {
  const ws = workspace as unknown as WorkspaceWithToolbox;
  ws.getFlyoutScale = function () {
    return 0.6;
  };
  let flyout = ws.getFlyout();
  if (!flyout && ws.getToolbox()) {
    flyout = ws.getToolbox().getFlyout();
  }
  if (flyout) {
    (flyout as unknown as FlyoutWithScrollbar).getFlyoutScale = function () {
      return 0.5;
    };
  }
};

// patchDropdownScrolling has been removed as per user request to use standard Blockly dropdowns.
