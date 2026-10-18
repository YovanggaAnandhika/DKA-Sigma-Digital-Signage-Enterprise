import React from 'react';

// Reusable shimmer base
export const ShimmerBase = ({ className = '', style = {} }) => (
  <div 
    className={`animate-pulse bg-slate-200 dark:bg-slate-700/50 rounded ${className}`} 
    style={{ ...style }}
  />
);

export const TopToolbarPlaceholder = () => (
  <div className="h-12 w-full border-b border-border bg-surface flex items-center px-4 justify-between">
    <div className="flex items-center gap-2">
      <ShimmerBase className="w-8 h-8 rounded-full" />
      <ShimmerBase className="w-32 h-6" />
    </div>
    <div className="flex gap-2">
      <ShimmerBase className="w-8 h-8" />
      <ShimmerBase className="w-8 h-8" />
      <ShimmerBase className="w-8 h-8" />
      <ShimmerBase className="w-20 h-8 rounded-md" />
    </div>
  </div>
);

export const LayersPanelPlaceholder = () => (
  <div className="h-full w-full p-4 flex flex-col gap-3">
    <div className="flex justify-between items-center mb-2">
      <ShimmerBase className="w-20 h-5" />
      <ShimmerBase className="w-6 h-6 rounded" />
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className="flex gap-2 items-center">
        <ShimmerBase className="w-6 h-6 rounded" />
        <ShimmerBase className="w-full h-10 rounded" />
      </div>
    ))}
  </div>
);

export const LayerBlockListPlaceholder = () => (
  <div className="h-full w-full p-4 flex flex-col gap-3">
    <div className="flex justify-between items-center mb-2">
      <ShimmerBase className="w-24 h-5" />
    </div>
    {[1, 2].map(i => (
      <ShimmerBase key={i} className="w-full h-16 rounded" />
    ))}
  </div>
);

export const CanvasWorkspacePlaceholder = () => (
  <div className="h-full w-full flex items-center justify-center p-8 bg-surface-elevated">
    <ShimmerBase className="w-3/4 h-3/4 rounded-xl shadow-sm" />
  </div>
);

export const TimelineEditorPlaceholder = () => (
  <div className="h-full w-full p-4 flex flex-col gap-2 border-t border-border bg-surface">
    <div className="flex items-center justify-between mb-2">
      <div className="flex gap-2">
        <ShimmerBase className="w-8 h-8 rounded" />
        <ShimmerBase className="w-8 h-8 rounded" />
        <ShimmerBase className="w-8 h-8 rounded" />
      </div>
      <ShimmerBase className="w-48 h-4 rounded" />
    </div>
    {[1, 2].map(i => (
      <div key={i} className="flex gap-2 mt-2">
        <ShimmerBase className="w-32 h-10 rounded" />
        <ShimmerBase className="flex-1 h-10 rounded" />
      </div>
    ))}
  </div>
);

export const InspectorPanelPlaceholder = () => (
  <div className="h-full w-full p-4 flex flex-col gap-4">
    <ShimmerBase className="w-24 h-5 mb-2" />
    
    <div className="space-y-2">
      <ShimmerBase className="w-16 h-4" />
      <ShimmerBase className="w-full h-10 rounded" />
    </div>
    
    <div className="flex gap-2 mt-2">
      <div className="flex-1 space-y-2">
        <ShimmerBase className="w-12 h-4" />
        <ShimmerBase className="w-full h-10 rounded" />
      </div>
      <div className="flex-1 space-y-2">
        <ShimmerBase className="w-12 h-4" />
        <ShimmerBase className="w-full h-10 rounded" />
      </div>
    </div>

    <div className="space-y-2 mt-4">
      <ShimmerBase className="w-16 h-4" />
      <ShimmerBase className="w-full h-10 rounded" />
    </div>
  </div>
);
