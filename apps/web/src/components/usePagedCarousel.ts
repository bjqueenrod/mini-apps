import { useCallback, useEffect, useRef, useState } from 'react';

function getPageStep(node: HTMLDivElement): number {
  const firstChild = node.firstElementChild as HTMLElement | null;
  if (!firstChild) {
    return node.clientWidth || 1;
  }

  const styles = window.getComputedStyle(node);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
  return firstChild.offsetWidth + gap || node.clientWidth || 1;
}

export function usePagedCarousel(pageCount: number) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const syncCurrentPage = useCallback(() => {
    const node = trackRef.current;
    if (!node || pageCount <= 1) {
      setCurrentPage(0);
      return;
    }

    const pageStep = getPageStep(node);
    const nextPage = Math.round(node.scrollLeft / pageStep);
    setCurrentPage(Math.max(0, Math.min(pageCount - 1, nextPage)));
  }, [pageCount]);

  useEffect(() => {
    syncCurrentPage();
  }, [pageCount, syncCurrentPage]);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) {
      return;
    }

    let frameId = 0;
    const handleScroll = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(syncCurrentPage);
    };

    const resizeObserver = new ResizeObserver(() => {
      syncCurrentPage();
    });

    node.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(node);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      node.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [syncCurrentPage]);

  const scrollToPage = useCallback(
    (pageIndex: number) => {
      const node = trackRef.current;
      if (!node) {
        return;
      }

      const safePageIndex = Math.max(0, Math.min(pageCount - 1, pageIndex));
      const pageStep = getPageStep(node);
      node.scrollTo({
        left: safePageIndex * pageStep,
        behavior: 'smooth',
      });
      setCurrentPage(safePageIndex);
    },
    [pageCount],
  );

  return {
    currentPage,
    scrollToPage,
    trackRef,
  };
}
