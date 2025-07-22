import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Square, Settings, Upload, Eye, EyeOff, Plus, Trash2, Radio, Activity, Users, Zap, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamContext';

interface Playlist {
  id: number;
  nome: string;
  total_videos?: number;
  duracao_total?: number;
}

interface Platform {
  id: number;
  nome: string;
  codigo: string;
  rtmp_base_url: string;
  requer_stream_key: boolean;
}

interface UserPlatform {
  id: number;
  id_platform: number;
  stream_key: string;
  rtmp_url: string;
  titulo_padrao: string;
  descricao_padrao: string;
  ativo: boolean;
  platform: Platform;
}

interface Logo {
  id: number;
  nome: string;
  url: string;
  tamanho: number;
  tipo_arquivo: string;
}

interface TransmissionSettings {
  titulo: string;
  descricao: string;
  playlist_id: string;
  platform_ids: number[];
  bitrate_override?: number;
  enable_recording: boolean;
  logo_id?: number;
  logo_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  logo_opacity: number;
}

interface StreamStatus {
  is_live: boolean;
  stream_type?: 'playlist' | 'obs';
  transmission?: {
    id: number;
    titulo: string;
    status: string;
    stats: {
      viewers: number;
      bitrate: number;
      uptime: string;
      isActive: boolean;
    };
    platforms: Array<{
      user_platform: {
        platform: {
          nome: string;
          codigo: string;
        };
      };
      status: string;
    }>;
  };
  obs_stream?: {
    is_live: boolean;
    viewers: number;
    bitrate: number;
    uptime: string;
    recording: boolean;
    platforms: any[];
  };
}

const IniciarTransmissao: React.FC = () => {
  const { getToken, user } = useAuth();
  const { streamData, refreshStreamStatus } = useStream();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([]);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  
  const [settings, setSettings] = useState<TransmissionSettings>({
    titulo: '',
    descricao: '',
    playlist_id: '',
    platform_ids: [],
    enable_recording: false,
    logo_position: 'top-right',
    logo_opacity: 80
  });

  // Platform configuration modal
  const [platformConfig, setPlatformConfig] = useState({
    platform_id: '',
    stream_key: '',
    rtmp_url: '',
    titulo_padrao: '',
    descricao_padrao: ''
  });

  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoName, setLogoName] = useState('');

  useEffect(() => {
    loadInitialData();
    checkStreamStatus();
    
    // Atualizar status a cada 10 segundos
    const interval = setInterval(checkStreamStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadPlaylists(),
      loadPlatforms(),
      loadUserPlatforms(),
      loadLogos()
    ]);
  };

  const loadPlaylists = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error('Erro ao carregar playlists:', error);
    }
  };

  const loadPlatforms = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setPlatforms(result.platforms);
      }
    } catch (error) {
      console.error('Erro ao carregar plataformas:', error);
    }
  };

  const loadUserPlatforms = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/user-platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setUserPlatforms(result.platforms);
      }
    } catch (error) {
      console.error('Erro ao carregar plataformas do usuário:', error);
    }
  };

  const loadLogos = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/logos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLogos(data);
    } catch (error) {
      console.error('Erro ao carregar logos:', error);
    }
  };

  const checkStreamStatus = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setStreamStatus(result);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleStartTransmission = async () => {
    if (!settings.titulo || !settings.playlist_id) {
      toast.error('Título e playlist são obrigatórios');
      return;
    }

    if (settings.platform_ids.length === 0) {
      toast.error('Selecione pelo menos uma plataforma');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Transmissão iniciada com sucesso!');
        checkStreamStatus();
        refreshStreamStatus();
        
        // Limpar formulário
        setSettings({
          titulo: '',
          descricao: '',
          playlist_id: '',
          platform_ids: [],
          enable_recording: false,
          logo_position: 'top-right',
          logo_opacity: 80
        });
      } else {
        toast.error(result.error || 'Erro ao iniciar transmissão');
      }
    } catch (error) {
      console.error('Erro ao iniciar transmissão:', error);
      toast.error('Erro ao iniciar transmissão');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTransmission = async () => {
    if (!streamStatus?.transmission?.id) return;

    if (!confirm('Deseja realmente finalizar a transmissão?')) return;

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          transmission_id: streamStatus.transmission.id,
          stream_type: 'playlist'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Transmissão finalizada com sucesso!');
        checkStreamStatus();
        refreshStreamStatus();
      } else {
        toast.error(result.error || 'Erro ao finalizar transmissão');
      }
    } catch (error) {
      console.error('Erro ao finalizar transmissão:', error);
      toast.error('Erro ao finalizar transmissão');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurePlatform = async () => {
    if (!platformConfig.platform_id || !platformConfig.stream_key) {
      toast.error('Plataforma e chave de transmissão são obrigatórios');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/configure-platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(platformConfig)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Plataforma configurada com sucesso!');
        loadUserPlatforms();
        setShowPlatformModal(false);
        setPlatformConfig({
          platform_id: '',
          stream_key: '',
          rtmp_url: '',
          titulo_padrao: '',
          descricao_padrao: ''
        });
      } else {
        toast.error(result.error || 'Erro ao configurar plataforma');
      }
    } catch (error) {
      console.error('Erro ao configurar plataforma:', error);
      toast.error('Erro ao configurar plataforma');
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !logoName) {
      toast.error('Selecione um arquivo e digite um nome para a logo');
      return;
    }

    const formData = new FormData();
    formData.append('logo', logoFile);
    formData.append('nome', logoName);

    try {
      const token = await getToken();
      const response = await fetch('/api/logos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('Logo enviada com sucesso!');
        loadLogos();
        setShowLogoModal(false);
        setLogoFile(null);
        setLogoName('');
      } else {
        toast.error('Erro ao enviar logo');
      }
    } catch (error) {
      console.error('Erro ao enviar logo:', error);
      toast.error('Erro ao enviar logo');
    }
  };

  const handleRemovePlatform = async (platformId: number) => {
    if (!confirm('Deseja remover esta plataforma?')) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/streaming/user-platforms/${platformId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Plataforma removida com sucesso!');
        loadUserPlatforms();
      } else {
        toast.error(result.error || 'Erro ao remover plataforma');
      }
    } catch (error) {
      console.error('Erro ao remover plataforma:', error);
      toast.error('Erro ao remover plataforma');
    }
  };

  const togglePlatformSelection = (platformId: number) => {
    setSettings(prev => ({
      ...prev,
      platform_ids: prev.platform_ids.includes(platformId)
        ? prev.platform_ids.filter(id => id !== platformId)
        : [...prev.platform_ids, platformId]
    }));
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSelectedPlatforms = () => {
    return userPlatforms.filter(up => settings.platform_ids.includes(up.id));
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
        <div className="flex items-center space-x-3">
          <Radio className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Iniciar Transmissão</h1>
        </div>
        
        <button
          onClick={checkStreamStatus}
          className="text-primary-600 hover:text-primary-800"
          title="Atualizar status"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Status da transmissão atual */}
      {streamStatus?.is_live && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
              <h2 className="text-lg font-semibold text-green-800">
                TRANSMISSÃO ATIVA - {streamStatus.stream_type?.toUpperCase()}
              </h2>
            </div>
            <button
              onClick={handleStopTransmission}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              <Square className="h-4 w-4 mr-2" />
              {loading ? 'Finalizando...' : 'Finalizar Transmissão'}
            </button>
          </div>

          {streamStatus.transmission && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-4 rounded-md">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Espectadores</p>
                    <p className="text-xl font-bold">{streamStatus.transmission.stats.viewers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Bitrate</p>
                    <p className="text-xl font-bold">{streamStatus.transmission.stats.bitrate} kbps</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Tempo Ativo</p>
                    <p className="text-xl font-bold">{streamStatus.transmission.stats.uptime}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Plataformas</p>
                    <p className="text-xl font-bold">{streamStatus.transmission.platforms.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {streamStatus.transmission?.platforms && streamStatus.transmission.platforms.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-green-800 mb-2">Plataformas Conectadas:</h3>
              <div className="flex flex-wrap gap-2">
                {streamStatus.transmission.platforms.map((platform, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
                      platform.status === 'conectada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {platform.user_platform.platform.nome} - {platform.status}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulário de configuração */}
      {!streamStatus?.is_live && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Configurar Nova Transmissão</h2>
          
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Transmissão *
                </label>
                <input
                  id="titulo"
                  type="text"
                  value={settings.titulo}
                  onChange={(e) => setSettings(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite o título da transmissão"
                />
              </div>

              <div>
                <label htmlFor="playlist" className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist *
                </label>
                <select
                  id="playlist"
                  value={settings.playlist_id}
                  onChange={(e) => setSettings(prev => ({ ...prev, playlist_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione uma playlist</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.nome} ({playlist.total_videos || 0} vídeos)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                id="descricao"
                value={settings.descricao}
                onChange={(e) => setSettings(prev => ({ ...prev, descricao: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Descrição da transmissão (opcional)"
              />
            </div>

            {/* Configurações avançadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enable_recording}
                    onChange={(e) => setSettings(prev => ({ ...prev, enable_recording: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm text-gray-700">Habilitar Gravação</span>
                </label>
              </div>

              <div>
                <label htmlFor="bitrate" className="block text-sm font-medium text-gray-700 mb-2">
                  Bitrate Override (kbps)
                </label>
                <input
                  id="bitrate"
                  type="number"
                  min="500"
                  max="10000"
                  value={settings.bitrate_override || ''}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    bitrate_override: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Automático"
                />
              </div>

              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                  Logo/Marca d'água
                </label>
                <select
                  id="logo"
                  value={settings.logo_id || ''}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    logo_id: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Sem logo</option>
                  {logos.map((logo) => (
                    <option key={logo.id} value={logo.id}>
                      {logo.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configurações da logo */}
            {settings.logo_id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-md">
                <div>
                  <label htmlFor="logo_position" className="block text-sm font-medium text-gray-700 mb-2">
                    Posição da Logo
                  </label>
                  <select
                    id="logo_position"
                    value={settings.logo_position}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      logo_position: e.target.value as any 
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="top-left">Superior Esquerda</option>
                    <option value="top-right">Superior Direita</option>
                    <option value="bottom-left">Inferior Esquerda</option>
                    <option value="bottom-right">Inferior Direita</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="logo_opacity" className="block text-sm font-medium text-gray-700 mb-2">
                    Opacidade da Logo ({settings.logo_opacity}%)
                  </label>
                  <input
                    id="logo_opacity"
                    type="range"
                    min="10"
                    max="100"
                    value={settings.logo_opacity}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      logo_opacity: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seleção de plataformas */}
      {!streamStatus?.is_live && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Plataformas de Transmissão</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowLogoModal(true)}
                className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload Logo
              </button>
              <button
                onClick={() => setShowPlatformModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Configurar Plataforma
              </button>
            </div>
          </div>

          {userPlatforms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Nenhuma plataforma configurada</p>
              <button
                onClick={() => setShowPlatformModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Configurar Primeira Plataforma
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPlatforms.map((userPlatform) => (
                <div
                  key={userPlatform.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    settings.platform_ids.includes(userPlatform.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => togglePlatformSelection(userPlatform.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{userPlatform.platform.nome}</h3>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.platform_ids.includes(userPlatform.id)}
                        onChange={() => togglePlatformSelection(userPlatform.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlatform(userPlatform.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Remover plataforma"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Stream Key:</strong> {userPlatform.stream_key.substring(0, 10)}...</p>
                    {userPlatform.titulo_padrao && (
                      <p><strong>Título:</strong> {userPlatform.titulo_padrao}</p>
                    )}
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      userPlatform.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {userPlatform.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {getSelectedPlatforms().length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-blue-900 font-medium mb-2">Plataformas Selecionadas:</h3>
              <div className="flex flex-wrap gap-2">
                {getSelectedPlatforms().map((platform) => (
                  <span
                    key={platform.id}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {platform.platform.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botão de iniciar transmissão */}
      {!streamStatus?.is_live && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-center">
            <button
              onClick={handleStartTransmission}
              disabled={loading || !settings.titulo || !settings.playlist_id || settings.platform_ids.length === 0}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-medium"
            >
              <Play className="h-6 w-6 mr-3" />
              {loading ? 'Iniciando Transmissão...' : 'Iniciar Transmissão'}
            </button>
          </div>
          
          {(!settings.titulo || !settings.playlist_id || settings.platform_ids.length === 0) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-yellow-800 text-sm">
                  <p className="font-medium mb-1">Preencha os campos obrigatórios:</p>
                  <ul className="space-y-1">
                    {!settings.titulo && <li>• Título da transmissão</li>}
                    {!settings.playlist_id && <li>• Playlist</li>}
                    {settings.platform_ids.length === 0 && <li>• Pelo menos uma plataforma</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de configuração de plataforma */}
      {showPlatformModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Configurar Plataforma</h3>
                <button
                  onClick={() => setShowPlatformModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plataforma *
                </label>
                <select
                  value={platformConfig.platform_id}
                  onChange={(e) => setPlatformConfig(prev => ({ ...prev, platform_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione uma plataforma</option>
                  {platforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave de Transmissão (Stream Key) *
                </label>
                <input
                  type="text"
                  value={platformConfig.stream_key}
                  onChange={(e) => setPlatformConfig(prev => ({ ...prev, stream_key: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Cole aqui a stream key da plataforma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL RTMP Customizada (Opcional)
                </label>
                <input
                  type="text"
                  value={platformConfig.rtmp_url}
                  onChange={(e) => setPlatformConfig(prev => ({ ...prev, rtmp_url: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="rtmp://servidor.com/live/"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título Padrão
                </label>
                <input
                  type="text"
                  value={platformConfig.titulo_padrao}
                  onChange={(e) => setPlatformConfig(prev => ({ ...prev, titulo_padrao: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Título que aparecerá na plataforma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição Padrão
                </label>
                <textarea
                  value={platformConfig.descricao_padrao}
                  onChange={(e) => setPlatformConfig(prev => ({ ...prev, descricao_padrao: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Descrição que aparecerá na plataforma"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPlatformModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfigurePlatform}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de upload de logo */}
      {showLogoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Upload de Logo</h3>
                <button
                  onClick={() => setShowLogoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Logo *
                </label>
                <input
                  type="text"
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite um nome para a logo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo da Logo *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: PNG, JPG, GIF, WebP (máx. 10MB)
                </p>
              </div>

              {logoFile && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="Preview"
                    className="max-w-full h-32 object-contain border border-gray-200 rounded"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleUploadLogo}
                disabled={!logoFile || !logoName}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Enviar Logo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IniciarTransmissao;