import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamContext';
import UniversalVideoPlayer from './UniversalVideoPlayer';

interface VideoPlayerProps {
  playlistVideo?: {
    id: number;
    nome: string;
    url: string;
    duracao?: number;
  };
  onVideoEnd?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ playlistVideo, onVideoEnd }) => {
  const { user } = useAuth();
  const { streamData } = useStream();

  const userLogin = user?.email?.split('@')[0] || 'usuario';
  
  // Priorizar vídeo da playlist se fornecido, senão usar stream ao vivo
  const videoSrc = playlistVideo?.url || 
    (streamData.isLive ? `http://stmv1.udicast.com:1935/samhost/${userLogin}_live/playlist.m3u8` : undefined);

  const videoTitle = playlistVideo?.nome || 
    (streamData.isLive ? streamData.title || 'Transmissão ao Vivo' : undefined);

  const isLive = !playlistVideo && streamData.isLive;

  return (
    <UniversalVideoPlayer
      src={videoSrc}
      title={videoTitle}
      isLive={isLive}
      autoplay={!!playlistVideo}
      muted={false}
      controls={true}
      onEnded={onVideoEnd}
      streamStats={isLive ? {
        viewers: streamData.viewers,
        bitrate: streamData.bitrate,
        uptime: streamData.uptime,
        quality: '1080p'
      } : undefined}
      className="w-full"
    />
  );
};

export default VideoPlayer;