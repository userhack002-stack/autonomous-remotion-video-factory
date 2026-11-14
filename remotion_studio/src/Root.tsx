import React from 'react';
import { Composition } from 'remotion';
import { ViralAgencyReel } from './ViralAgencyReel';
import videoData from './video_data.json';

export const RemotionRoot: React.FC = () => {
  const scenesSec = videoData.scenes.reduce((acc: number, s: any) => acc + (Number(s.duration_sec) || 5), 0);
  const totalSec = Math.max(scenesSec + 2.5, Number(videoData.audio_duration_sec || 0) + 2.5);
  return (
    <Composition
      id="ViralAgencyReel"
      component={ViralAgencyReel}
      durationInFrames={Math.round(totalSec * 30)}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
