'use client';

import { usePathname } from 'next/navigation';

type SkeletonVariant = 'dashboard' | 'table' | 'gallery' | 'form' | 'detail' | 'canvas' | 'queue' | 'queueEditor';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`page-skeleton-block ${className}`} />;
}

export default function PageLoadingSkeleton({ variant }: { variant: SkeletonVariant }) {
  const pathname = usePathname();
  const hasParentHeader =
    (pathname.startsWith('/studio/components') &&
      !pathname.includes('/create') &&
      !pathname.includes('/edit')) ||
    ['/studio/layouts', '/studio/layouts/data', '/studio/layouts/history', '/studio/layouts/resolusi', '/studio/layouts/orientasi'].includes(pathname);

  return (
    <div className="page-loading-skeleton" role="status" aria-label="Memuat halaman" aria-busy="true">
      {!hasParentHeader && (
        <div className="page-skeleton-heading" aria-hidden="true">
          <SkeletonBlock className="page-skeleton-heading-icon" />
          <div className="page-skeleton-heading-copy">
            <SkeletonBlock className="page-skeleton-title" />
            <SkeletonBlock className="page-skeleton-description" />
          </div>
        </div>
      )}

      {variant === 'dashboard' ? (
        <>
          <div className="page-skeleton-metrics" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="page-skeleton-metric" />)}
          </div>
          <SkeletonBlock className="page-skeleton-chart" />
        </>
      ) : variant === 'form' || variant === 'canvas' || variant === 'queueEditor' ? (
        variant === 'queueEditor' ? (
          <>
            <div className="page-skeleton-toolbar" aria-hidden="true">
              <SkeletonBlock className="page-skeleton-button" />
              <SkeletonBlock className="page-skeleton-title" />
              <SkeletonBlock className="page-skeleton-button" />
            </div>
            <SkeletonBlock className="page-skeleton-tabs" />
            <div className="page-skeleton-canvas-layout" aria-hidden="true">
              <SkeletonBlock className="page-skeleton-inspector" />
              <SkeletonBlock className="page-skeleton-canvas" />
              <SkeletonBlock className="page-skeleton-inspector" />
            </div>
          </>
        ) : variant === 'canvas' ? (
          <>
            <div className="page-skeleton-toolbar" aria-hidden="true">
              <SkeletonBlock className="page-skeleton-button" />
              <SkeletonBlock className="page-skeleton-button" />
            </div>
            <div className="page-skeleton-canvas-layout" aria-hidden="true">
              <SkeletonBlock className="page-skeleton-inspector" />
              <SkeletonBlock className="page-skeleton-canvas" />
              <SkeletonBlock className="page-skeleton-inspector" />
            </div>
          </>
        ) : (
          <>
            <div className="page-skeleton-toolbar" aria-hidden="true">
              <SkeletonBlock className="page-skeleton-button" />
              <SkeletonBlock className="page-skeleton-button" />
            </div>
            <div className="page-skeleton-form-grid" aria-hidden="true">
              <SkeletonBlock className="page-skeleton-form-card" />
              <SkeletonBlock className="page-skeleton-form-card" />
            </div>
          </>
        )
      ) : variant === 'detail' ? (
        <>
          <SkeletonBlock className="page-skeleton-detail-banner" />
          <div className="page-skeleton-form-grid" aria-hidden="true">
            <SkeletonBlock className="page-skeleton-form-card" />
            <SkeletonBlock className="page-skeleton-form-card" />
          </div>
        </>
      ) : variant === 'gallery' ? (
        <>
          <div className="page-skeleton-toolbar" aria-hidden="true">
            <SkeletonBlock className="page-skeleton-search" />
            <SkeletonBlock className="page-skeleton-button" />
          </div>
          <div className="page-skeleton-gallery" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <SkeletonBlock key={index} className="page-skeleton-gallery-card" />)}
          </div>
        </>
      ) : (
        <>
          {variant === 'queue' && <SkeletonBlock className="page-skeleton-tabs" />}
          <div className="page-skeleton-toolbar" aria-hidden="true">
            <SkeletonBlock className="page-skeleton-search" />
            <SkeletonBlock className="page-skeleton-button" />
          </div>
          <div className="page-skeleton-table" aria-hidden="true">
            <div className="page-skeleton-table-head">
              {Array.from({ length: 5 }, (_, index) => <SkeletonBlock key={index} />)}
            </div>
            {Array.from({ length: 6 }, (_, index) => (
              <div className="page-skeleton-table-row" key={index}>
                {Array.from({ length: 5 }, (_, cell) => <SkeletonBlock key={cell} />)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
