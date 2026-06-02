import { useCallback } from 'react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '@/lib/tour/tour.css';
import { tourFlows, type TourKey, type TourStep } from '@/lib/tour/tourSteps';

const waitForElement = (selector: string, timeout = 2000) =>
  new Promise<Element | null>((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);
    const start = Date.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - start > timeout) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });

/**
 * Build driver.js steps with per-step click-to-advance behavior.
 * When the active step lists `advanceOnClick` selectors, clicking any of
 * those elements moves the tour forward (and waits for the next target
 * to render before refreshing the highlight).
 */
const buildSteps = (raw: TourStep[], getDriver: () => Driver | null) => {
  const cleanups: Array<() => void> = [];
  const detachAll = () => {
    while (cleanups.length) cleanups.pop()?.();
  };

  return raw.map((step, index) => ({
    ...step,
    onHighlightStarted: (el: Element | undefined) => {
      detachAll();
      if (!step.advanceOnClick?.length) return;

      const handler = async () => {
        detachAll();
        const d = getDriver();
        if (!d) return;
        // Wait for the next step's element so the highlight lands on the
        // newly-rendered UI instead of an empty box.
        const next = raw[index + 1];
        const nextSelector = typeof next?.element === 'string' ? next.element : null;
        if (nextSelector) await waitForElement(nextSelector, 1500);
        d.moveNext();
      };

      step.advanceOnClick.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
          node.addEventListener('click', handler, { once: true });
          cleanups.push(() => node.removeEventListener('click', handler));
        });
      });
    },
    onDeselected: () => {
      detachAll();
    },
  }));
};

export const useGuidedTour = () => {
  const startTour = useCallback(async (key: TourKey) => {
    window.dispatchEvent(new CustomEvent('picode:open-sidebar'));
    await waitForElement('[data-tour="sidebar-nav"]', 600);

    let instance: Driver | null = null;
    const steps = buildSteps(tourFlows[key], () => instance);

    instance = driver({
      showProgress: true,
      allowClose: true,
      animate: true,
      smoothScroll: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 14,
      popoverClass: 'picode-tour',
      nextBtnText: 'Próximo',
      prevBtnText: 'Voltar',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      steps,
    });

    instance.drive();
  }, []);

  return { startTour };
};
