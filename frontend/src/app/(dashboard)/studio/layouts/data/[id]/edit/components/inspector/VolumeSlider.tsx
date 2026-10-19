'use client';

import React from 'react';

export default function VolumeSlider({
  initialVolume,
  onCommit,
}: {
  initialVolume: number;
  onCommit: (val: number) => void;
}) {
  const [localVol, setLocalVol] = React.useState(initialVolume);

  React.useEffect(() => {
    setLocalVol(initialVolume);
  }, [initialVolume]);

  return (
    <input
      type="range"
      min="0"
      max="100"
      value={localVol}
      onChange={(e) => setLocalVol(Number(e.target.value))}
      onMouseUp={() => onCommit(localVol)}
      onTouchEnd={() => onCommit(localVol)}
      style={{ width: '100%', cursor: 'pointer' }}
    />
  );
}
