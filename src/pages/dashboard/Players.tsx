import React, { useState, useEffect } from 'react';
import { ChevronLeft, Copy, ExternalLink, Smartphone, Monitor, Globe, Code, Download, Share2, Settings, Play, Pause, Volume2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import UniversalVideoPlayer from '../../components/UniversalVideoPlayer';

interface PlayerConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  compatibility: string[];
  embedCode: string;
  previewUrl?: string;
}

const Players: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('universal');
  const [showPreview, setShowPreview] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    autoplay: false,
    controls: true,
    muted: false,
    loop: false,
    width: '100%',
    height: '400px',
    quality: 'auto',
    theme: 'dark'
  });

  const userLogin = user?.email?.split('@')[0] || 'usuario';
  const streamUrl = `http://stmv1.udicast.com:1935/samhost/${userLogin}_live/playlist.m3u8`;
  const embedUrl = `https://player.exemplo.com/embed/${userLogin}`;

  const playerConfigs: PlayerConfig[] = [
    {
      id: 'universal',
      name: 'Player Universal (Recomendado)',
      description: 'Player moderno que funciona em todos os dispositivos - celulares, tablets e computadores. Suporta HLS, DASH, MP4 e transmissões ao vivo.',
      icon: Globe,
      features: [
        'Funciona em todos os dispositivos',
        'Suporte a HLS e DASH',
        'Controles touch para mobile',
        'Qualidade adaptativa automática',
        'Fullscreen nativo',
        'Marca d\'água personalizável',
        'Estatísticas em tempo real',
        'Download de vídeos',
        'Compartilhamento nativo'
      ],
      compatibility: ['iOS Safari', 'Android Chrome', 'Desktop Chrome', 'Firefox', 'Edge', 'Smart TVs'],
      embedCode: `<div id="universal-player"></div>
<script src="https://vjs.zencdn.net/7.21.1/video.min.js"></script>
<link href="https://vjs.zencdn.net/7.21.1/video-js.css" rel="stylesheet">
<script>
  var player = videojs('universal-player', {
    sources: [{
      src: '${streamUrl}',
      type: 'application/x-mpegURL'
    }],
    fluid: true,
    responsive: true,
    autoplay: ${customSettings.autoplay},
    controls: ${customSettings.controls},
    muted: ${customSettings.muted},
    loop: ${customSettings.loop},
    playbackRates: [0.5, 1, 1.25, 1.5, 2]
  });
</script>`,
      previewUrl: streamUrl
    },
    {
      id: 'iframe',
      name: 'iFrame Responsivo',
      description: 'Incorporação simples via iframe, ideal para sites e blogs. Funciona bem em desktop e mobile.',
      icon: Code,
      features: [
        'Fácil implementação',
        'Responsivo por padrão',
        'Isolamento de segurança',
        'Compatível com WordPress',
        'Não requer JavaScript'
      ],
      compatibility: ['Todos os navegadores', 'WordPress', 'Wix', 'Squarespace'],
      embedCode: `<iframe 
  src="${embedUrl}?autoplay=${customSettings.autoplay ? 1 : 0}&controls=${customSettings.controls ? 1 : 0}&muted=${customSettings.muted ? 1 : 0}" 
  width="${customSettings.width}" 
  height="${customSettings.height}" 
  frameborder="0" 
  allowfullscreen
  allow="autoplay; fullscreen; picture-in-picture">
</iframe>`,
      previewUrl: embedUrl
    },
    {
      id: 'html5',
      name: 'HTML5 Video Nativo',
      description: 'Player HTML5 puro, leve e rápido. Melhor para vídeos MP4 simples.',
      icon: Play,
      features: [
        'Muito leve e rápido',
        'Suporte nativo do navegador',
        'Controles padrão',
        'Boa performance'
      ],
      compatibility: ['Navegadores modernos', 'Mobile básico'],
      embedCode: `<video 
  width="${customSettings.width}" 
  height="${customSettings.height}" 
  ${customSettings.controls ? 'controls' : ''}
  ${customSettings.autoplay ? 'autoplay' : ''}
  ${customSettings.muted ? 'muted' : ''}
  ${customSettings.loop ? 'loop' : ''}
  preload="metadata"
  playsinline>
  <source src="${streamUrl}" type="application/x-mpegURL">
  <source src="${streamUrl.replace('.m3u8', '.mp4')}" type="video/mp4">
  Seu navegador não suporta o elemento de vídeo.
</video>`,
      previewUrl: streamUrl
    },
    {
      id: 'mobile',
      name: 'Player Mobile Otimizado',
      description: 'Especialmente otimizado para dispositivos móveis com controles touch e interface simplificada.',
      icon: Smartphone,
      features: [
        'Interface touch otimizada',
        'Controles grandes para mobile',
        'Economia de dados',
        'Rotação automática',
        'Gestos de controle'
      ],
      compatibility: ['iOS', 'Android', 'Mobile browsers'],
      embedCode: `<div id="mobile-player" class="mobile-optimized"></div>
<script src="https://vjs.zencdn.net/7.21.1/video.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/videojs-mobile-ui@0.8.0/dist/videojs-mobile-ui.min.js"></script>
<script>
  var mobilePlayer = videojs('mobile-player', {
    sources: [{ src: '${streamUrl}', type: 'application/x-mpegURL' }],
    fluid: true,
    playbackRates: [0.75, 1, 1.25, 1.5],
    responsive: true
  });
  mobilePlayer.mobileUi();
</script>
<style>
  .mobile-optimized .vjs-control-bar { height: 4em; }
  .mobile-optimized .vjs-button { font-size: 1.8em; }
</style>`
    },
    {
      id: 'facebook',
      name: 'Facebook Live Player',
      description: 'Player otimizado para transmissões do Facebook Live com integração social.',
      icon: Share2,
      features: [
        'Integração com Facebook',
        'Comentários em tempo real',
        'Compartilhamento social',
        'Reações ao vivo'
      ],
      compatibility: ['Facebook', 'Navegadores com Facebook SDK'],
      embedCode: `<div id="fb-root"></div>
<script async defer crossorigin="anonymous" 
  src="https://connect.facebook.net/pt_BR/sdk.js#xfbml=1&version=v18.0">
</script>
<div class="fb-video" 
  data-href="${streamUrl}" 
  data-width="${customSettings.width}" 
  data-height="${customSettings.height}"
  data-autoplay="${customSettings.autoplay}"
  data-show-text="false">
</div>`
    },
    {
      id: 'app-android',
      name: 'App Android Nativo',
      description: 'Código para integração em aplicativos Android nativos usando ExoPlayer.',
      icon: Smartphone,
      features: [
        'Performance nativa',
        'Suporte completo a HLS/DASH',
        'Controles customizáveis',
        'Offline playback',
        'Picture-in-picture'
      ],
      compatibility: ['Android 5.0+', 'Android TV'],
      embedCode: `// build.gradle (Module: app)
implementation 'com.google.android.exoplayer:exoplayer:2.19.1'

// MainActivity.java
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.ui.StyledPlayerView;

public class MainActivity extends AppCompatActivity {
    private ExoPlayer player;
    private StyledPlayerView playerView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        playerView = findViewById(R.id.player_view);
        player = new ExoPlayer.Builder(this).build();
        playerView.setPlayer(player);
        
        MediaItem mediaItem = MediaItem.fromUri("${streamUrl}");
        player.setMediaItem(mediaItem);
        player.prepare();
        player.setPlayWhenReady(${customSettings.autoplay});
    }
}`
    }
  ];

  const selectedConfig = playerConfigs.find(p => p.id === selectedPlayer) || playerConfigs[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedConfig.embedCode);
    toast.success('Código copiado para a área de transferência!');
  };

  const handleCopyUrl = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const generateCustomCode = () => {
    const config = playerConfigs.find(p => p.id === selectedPlayer);
    if (config) {
      return config.embedCode;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link to="/dashboard" className="flex items-center text-primary-600 hover:text-primary-800">
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Players de Vídeo</h1>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? 'Ocultar Preview' : 'Mostrar Preview'}
        </button>
      </div>

      {/* Preview do Player Universal */}
      {showPreview && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Preview - Player Universal</h2>
          <div className="max-w-4xl">
            <UniversalVideoPlayer
              src={streamUrl}
              title="Transmissão ao Vivo - Exemplo"
              isLive={true}
              autoplay={customSettings.autoplay}
              muted={customSettings.muted}
              controls={customSettings.controls}
              streamStats={{
                viewers: 42,
                bitrate: 2500,
                uptime: '01:23:45',
                quality: '1080p'
              }}
              watermark={{
                url: '/logo.png',
                position: 'top-right',
                opacity: 80
              }}
            />
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-sm">
              <strong>Preview:</strong> Este é o Player Universal em ação. Funciona perfeitamente em celulares, tablets e computadores com controles adaptativos.
            </p>
          </div>
        </div>
      )}

      {/* Seleção de Player */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Escolha o Tipo de Player</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {playerConfigs.map((config) => {
            const IconComponent = config.icon;
            return (
              <div
                key={config.id}
                onClick={() => setSelectedPlayer(config.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPlayer === config.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-3">
                  <IconComponent className="h-6 w-6 text-primary-600 mr-3" />
                  <h3 className="font-semibold text-gray-900">{config.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                <div className="flex flex-wrap gap-1">
                  {config.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {config.features.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{config.features.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configurações Personalizadas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Configurações do Player</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={customSettings.autoplay}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, autoplay: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <span className="text-sm text-gray-700">Reprodução Automática</span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={customSettings.controls}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, controls: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <span className="text-sm text-gray-700">Mostrar Controles</span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={customSettings.muted}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, muted: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <span className="text-sm text-gray-700">Iniciar Mudo</span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={customSettings.loop}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, loop: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <span className="text-sm text-gray-700">Repetir Vídeo</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Largura</label>
            <input
              type="text"
              value={customSettings.width}
              onChange={(e) => setCustomSettings(prev => ({ ...prev, width: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="100% ou 640px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Altura</label>
            <input
              type="text"
              value={customSettings.height}
              onChange={(e) => setCustomSettings(prev => ({ ...prev, height: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="400px ou 360px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualidade</label>
            <select
              value={customSettings.quality}
              onChange={(e) => setCustomSettings(prev => ({ ...prev, quality: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="auto">Automática</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
            <select
              value={customSettings.theme}
              onChange={(e) => setCustomSettings(prev => ({ ...prev, theme: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detalhes do Player Selecionado */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{selectedConfig.name}</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleCopyCode}
              className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar Código
            </button>
            {selectedConfig.previewUrl && (
              <a
                href={selectedConfig.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir Preview
              </a>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-4">{selectedConfig.description}</p>

        {/* Recursos */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recursos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedConfig.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compatibilidade */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Compatibilidade</h3>
          <div className="flex flex-wrap gap-2">
            {selectedConfig.compatibility.map((item, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Código de Incorporação */}
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Código de Incorporação</span>
            <button
              className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
              onClick={handleCopyCode}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar
            </button>
          </div>
          <div className="bg-gray-900 p-4 overflow-x-auto">
            <pre className="text-gray-100 font-mono text-sm whitespace-pre-wrap">
              {generateCustomCode()}
            </pre>
          </div>
        </div>
      </div>

      {/* URLs Diretas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">URLs Diretas</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">URL HLS (M3U8) - Recomendada</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {streamUrl}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => handleCopyUrl(streamUrl, 'URL HLS')}
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Melhor para transmissões ao vivo e qualidade adaptativa</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">URL de Incorporação</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {embedUrl}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => handleCopyUrl(embedUrl, 'URL de Incorporação')}
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Para usar em iframes e incorporações</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">URL de Compartilhamento</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                https://streaming.exemplo.com/watch/{userLogin}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => handleCopyUrl(`https://streaming.exemplo.com/watch/${userLogin}`, 'URL de Compartilhamento')}
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Para compartilhar com espectadores</p>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📱 Player Universal - A Melhor Escolha</h3>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">✓</div>
            <p><strong>Funciona em TODOS os dispositivos:</strong> iPhone, Android, tablets, computadores, Smart TVs</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">✓</div>
            <p><strong>Controles adaptativos:</strong> Touch para mobile, mouse para desktop, controle remoto para TV</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">✓</div>
            <p><strong>Qualidade automática:</strong> Ajusta a qualidade baseada na conexão do usuário</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">✓</div>
            <p><strong>Recursos avançados:</strong> Marca d'água, estatísticas, download, compartilhamento</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Players;