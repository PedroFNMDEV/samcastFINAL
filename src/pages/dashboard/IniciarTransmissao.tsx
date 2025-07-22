import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Square, Settings, Copy, Radio, Users, BarChart3, Wifi, WifiOff, Youtube, Instagram, Facebook, Twitch, Video, Globe, Zap, Activity, AlertCircle, CheckCircle, Plus, Trash2, Upload, Image, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamContext';

interface Platform {
  id: string;
  nome: string;
  codigo: string;
  icone: string;
  rtmp_base_url: string;
  requer_stream_key: boolean;
}

interface UserPlatform {
  id: string;
  id_platform: string;
  stream_key: string;
  rtmp_url: string;
  titulo_padrao?: string;
  descricao_padrao?: string;
  ativo: boolean;
  platform: Platform;
}

interface Playlist {
  id: number;
  nome: string;
}

interface Logo {
  id: string;
  nome: string;
  url: string;
  tamanho: number;
  tipo_arquivo: string;
}

interface TransmissionSettings {
  id: string;
  nome: string;
  id_logo?: string;
  logo_posicao: string;
  logo_opacidade: number;
  logo_tamanho: string;
  logo_margem_x: number;
  logo_margem_y: number;
  embaralhar_videos: boolean;
  repetir_playlist: boolean;
  transicao_videos: string;
  resolucao: string;
  fps: number;
  bitrate: number;
  titulo_padrao?: string;
  descricao_padrao?: string;
  logo?: Logo;
}

interface TransmissionStatus {
  is_live: boolean;
  transmission?: {
    id: string;
    titulo: string;
    status: string;
    data_inicio: string;
    stats: {
      viewers: number;
      bitrate: number;
      uptime: string;
      isActive: boolean;
    };
    platforms: Array<{
      user_platform: {
        platform: Platform;
      };
      status: string;
    }>;
  };
}

const IniciarTransmissao: React.FC = () => {
  const { getToken } = useAuth();
  const { streamData, updateStreamData } = useStream();
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [transmissionSettings, setTransmissionSettings] = useState<TransmissionSettings[]>([]);
  const [transmissionStatus, setTransmissionStatus] = useState<TransmissionStatus>({ is_live: false });
  
  const [loading, setLoading] = useState(false);
  const [showPlatformConfig, setShowPlatformConfig] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [selectedSettings, setSelectedSettings] = useState<string>('');
  
  // Form para nova plataforma
  const [newPlatformForm, setNewPlatformForm] = useState({
    platform_id: '',
    stream_key: '',
    rtmp_url: '',
    titulo_padrao: '',
    descricao_padrao: ''
  });

  // Form para transmissão
  const [transmissionForm, setTransmissionForm] = useState({
    titulo: '',
    descricao: ''
  });

  // Form para upload de logo
  const [logoUploadForm, setLogoUploadForm] = useState({
    nome: '',
    file: null as File | null
  });

  // Form para configurações avançadas
  const [advancedSettingsForm, setAdvancedSettingsForm] = useState({
    nome: 'Nova Configuração',
    id_logo: '',
    logo_posicao: 'top-right',
    logo_opacidade: 80,
    logo_tamanho: 'medium',
    logo_margem_x: 20,
    logo_margem_y: 20,
    embaralhar_videos: false,
    repetir_playlist: true,
    transicao_videos: 'fade',
    resolucao: '1080p',
    fps: 30,
    bitrate: 2500,
    titulo_padrao: '',
    descricao_padrao: ''
  });

  useEffect(() => {
    loadInitialData();
    checkTransmissionStatus();

    // Atualizar status a cada 30 segundos se estiver transmitindo
    const interval = setInterval(() => {
      if (transmissionStatus.is_live) {
        checkTransmissionStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      const token = await getToken();
      
      // Carregar plataformas disponíveis
      const platformsResponse = await fetch('/api/streaming/platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const platformsData = await platformsResponse.json();
      if (platformsData.success) {
        setPlatforms(platformsData.platforms);
      }

      // Carregar plataformas configuradas pelo usuário
      const userPlatformsResponse = await fetch('/api/streaming/user-platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userPlatformsData = await userPlatformsResponse.json();
      if (userPlatformsData.success) {
        setUserPlatforms(userPlatformsData.platforms);
      }

      // Carregar playlists
      const playlistsResponse = await fetch('/api/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const playlistsData = await playlistsResponse.json();
      setPlaylists(playlistsData);

      // Carregar logos
      const logosResponse = await fetch('/api/logos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const logosData = await logosResponse.json();
      setLogos(logosData);

      // Carregar configurações de transmissão
      const settingsResponse = await fetch('/api/transmission-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const settingsData = await settingsResponse.json();
      setTransmissionSettings(settingsData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados iniciais');
    }
  };

  const checkTransmissionStatus = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setTransmissionStatus(result);
        
        // Atualizar contexto de stream
        if (result.is_live && result.transmission) {
          updateStreamData({
            isLive: true,
            viewers: result.transmission.stats.viewers,
            bitrate: result.transmission.stats.bitrate,
            uptime: result.transmission.stats.uptime,
            title: result.transmission.titulo
          });
        } else {
          updateStreamData({
            isLive: false,
            viewers: 0,
            bitrate: 0,
            uptime: '00:00:00'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleConfigurePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlatformForm.platform_id || !newPlatformForm.stream_key) {
      toast.error('Plataforma e Stream Key são obrigatórios');
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
        body: JSON.stringify(newPlatformForm)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Plataforma configurada com sucesso!');
        setNewPlatformForm({
          platform_id: '',
          stream_key: '',
          rtmp_url: '',
          titulo_padrao: '',
          descricao_padrao: ''
        });
        setShowPlatformConfig(false);
        loadInitialData();
      } else {
        toast.error(result.error || 'Erro ao configurar plataforma');
      }
    } catch (error) {
      console.error('Erro ao configurar plataforma:', error);
      toast.error('Erro ao configurar plataforma');
    }
  };

  const handleLogoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!logoUploadForm.nome || !logoUploadForm.file) {
      toast.error('Nome e arquivo são obrigatórios');
      return;
    }

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('nome', logoUploadForm.nome);
      formData.append('logo', logoUploadForm.file);

      const response = await fetch('/api/logos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Logo enviada com sucesso!');
        setLogoUploadForm({ nome: '', file: null });
        setShowLogoUpload(false);
        loadInitialData();
      } else {
        toast.error(result.error || 'Erro ao enviar logo');
      }
    } catch (error) {
      console.error('Erro ao enviar logo:', error);
      toast.error('Erro ao enviar logo');
    }
  };

  const handleSaveAdvancedSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = await getToken();
      const response = await fetch('/api/transmission-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(advancedSettingsForm)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!');
        setShowAdvancedSettings(false);
        loadInitialData();
      } else {
        toast.error(result.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleStartTransmission = async () => {
    if (!transmissionForm.titulo) {
      toast.error('Título da transmissão é obrigatório');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Selecione pelo menos uma plataforma');
      return;
    }

    if (!selectedPlaylist) {
      toast.error('Selecione uma playlist');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      
      // Buscar configurações selecionadas
      let settings = {};
      if (selectedSettings) {
        const settingsData = transmissionSettings.find(s => s.id === selectedSettings);
        if (settingsData) {
          settings = {
            embaralhar_videos: settingsData.embaralhar_videos,
            repetir_playlist: settingsData.repetir_playlist,
            logo_config: settingsData.logo ? {
              url: settingsData.logo.url,
              posicao: settingsData.logo_posicao,
              opacidade: settingsData.logo_opacidade,
              tamanho: settingsData.logo_tamanho,
              margem_x: settingsData.logo_margem_x,
              margem_y: settingsData.logo_margem_y
            } : null
          };
        }
      }

      const response = await fetch('/api/streaming/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: transmissionForm.titulo,
          descricao: transmissionForm.descricao,
          playlist_id: selectedPlaylist,
          platform_ids: selectedPlatforms,
          id_transmission_settings: selectedSettings || null,
          settings
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Transmissão iniciada com sucesso!');
        checkTransmissionStatus();
        setTransmissionForm({ titulo: '', descricao: '' });
        setSelectedPlatforms([]);
        setSelectedPlaylist('');
        setSelectedSettings('');
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
    if (!transmissionStatus.transmission) return;

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
          transmission_id: transmissionStatus.transmission.id
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Transmissão finalizada com sucesso!');
        checkTransmissionStatus();
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

  const removePlatform = async (platformId: string) => {
    if (!confirm('Deseja remover esta plataforma?')) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/streaming/user-platforms/${platformId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Plataforma removida com sucesso!');
        loadInitialData();
      } else {
        toast.error('Erro ao remover plataforma');
      }
    } catch (error) {
      console.error('Erro ao remover plataforma:', error);
      toast.error('Erro ao remover plataforma');
    }
  };

  const removeLogo = async (logoId: string) => {
    if (!confirm('Deseja remover esta logo?')) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/logos/${logoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Logo removida com sucesso!');
        loadInitialData();
      } else {
        toast.error('Erro ao remover logo');
      }
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo');
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      youtube: Youtube,
      instagram: Instagram,
      facebook: Facebook,
      twitch: Twitch,
      video: Video,
      globe: Globe,
      zap: Zap,
      activity: Activity
    };
    return icons[iconName] || Activity;
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
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Radio className="h-8 w-8 mr-3 text-primary-600" />
          Gerenciar Transmissão
        </h1>
      </div>

      {/* Status da transmissão atual */}
      {transmissionStatus.is_live && transmissionStatus.transmission && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
              <h2 className="text-lg font-semibold text-green-800">TRANSMISSÃO AO VIVO</h2>
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

          <div className="mb-4">
            <h3 className="font-medium text-green-800">{transmissionStatus.transmission.titulo}</h3>
            <p className="text-sm text-green-600">
              Iniciada em: {new Date(transmissionStatus.transmission.data_inicio).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Espectadores</p>
                  <p className="text-xl font-bold">{transmissionStatus.transmission.stats.viewers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Bitrate</p>
                  <p className="text-xl font-bold">{transmissionStatus.transmission.stats.bitrate} kbps</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center">
                <Wifi className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Tempo Ativo</p>
                  <p className="text-xl font-bold">{transmissionStatus.transmission.stats.uptime}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center">
                <Radio className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Plataformas</p>
                  <p className="text-xl font-bold">{transmissionStatus.transmission.platforms.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plataformas ativas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {transmissionStatus.transmission.platforms.map((tp, index) => {
              const IconComponent = getIconComponent(tp.user_platform.platform.icone);
              const statusColor = tp.status === 'ativa' ? 'bg-green-100 border-green-200 text-green-800' :
                                tp.status === 'erro' ? 'bg-red-100 border-red-200 text-red-800' :
                                'bg-gray-100 border-gray-200 text-gray-800';

              return (
                <div key={index} className={`p-3 rounded-lg border ${statusColor}`}>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{tp.user_platform.platform.nome}</p>
                      <p className="text-sm capitalize">{tp.status}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Configuração de plataformas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Plataformas Configuradas</h2>
          <button
            onClick={() => setShowPlatformConfig(!showPlatformConfig)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Plataforma
          </button>
        </div>

        {/* Lista de plataformas configuradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {userPlatforms.map((up) => {
            const IconComponent = getIconComponent(up.platform.icone);
            return (
              <div key={up.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-primary-600" />
                    <span className="font-medium">{up.platform.nome}</span>
                  </div>
                  <button
                    onClick={() => removePlatform(up.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  Key: {up.stream_key.substring(0, 20)}...
                </p>
                {up.titulo_padrao && (
                  <p className="text-sm text-gray-600 truncate">
                    Título: {up.titulo_padrao}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Formulário para nova plataforma */}
        {showPlatformConfig && (
          <form onSubmit={handleConfigurePlatform} className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Configurar Nova Plataforma</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plataforma
                </label>
                <select
                  value={newPlatformForm.platform_id}
                  onChange={(e) => setNewPlatformForm(prev => ({ ...prev, platform_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Selecione uma plataforma</option>
                  {platforms.filter(p => !userPlatforms.some(up => up.id_platform === p.id)).map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream Key
                </label>
                <input
                  type="text"
                  value={newPlatformForm.stream_key}
                  onChange={(e) => setNewPlatformForm(prev => ({ ...prev, stream_key: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Chave de transmissão da plataforma"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL RTMP (opcional)
                </label>
                <input
                  type="text"
                  value={newPlatformForm.rtmp_url}
                  onChange={(e) => setNewPlatformForm(prev => ({ ...prev, rtmp_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="URL personalizada (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título Padrão (opcional)
                </label>
                <input
                  type="text"
                  value={newPlatformForm.titulo_padrao}
                  onChange={(e) => setNewPlatformForm(prev => ({ ...prev, titulo_padrao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Título padrão para transmissões"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição Padrão (opcional)
              </label>
              <textarea
                value={newPlatformForm.descricao_padrao}
                onChange={(e) => setNewPlatformForm(prev => ({ ...prev, descricao_padrao: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Descrição padrão para transmissões"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPlatformConfig(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Salvar Plataforma
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Gerenciamento de Logos */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Logos para Transmissão</h2>
          <button
            onClick={() => setShowLogoUpload(!showLogoUpload)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Enviar Logo
          </button>
        </div>

        {/* Lista de logos */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {logos.map((logo) => (
            <div key={logo.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium truncate">{logo.nome}</span>
                <button
                  onClick={() => removeLogo(logo.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="aspect-video bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                <img
                  src={logo.url}
                  alt={logo.nome}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="text-xs text-gray-500">
                {(logo.tamanho / 1024).toFixed(1)} KB
              </p>
            </div>
          ))}
        </div>

        {/* Formulário para upload de logo */}
        {showLogoUpload && (
          <form onSubmit={handleLogoUpload} className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Enviar Nova Logo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Logo
                </label>
                <input
                  type="text"
                  value={logoUploadForm.nome}
                  onChange={(e) => setLogoUploadForm(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nome para identificar a logo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arquivo da Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLogoUpload(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Enviar Logo
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Configurações Avançadas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Configurações de Transmissão</h2>
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Nova Configuração
          </button>
        </div>

        {/* Lista de configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {transmissionSettings.map((setting) => (
            <div key={setting.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{setting.nome}</span>
                <div className="flex items-center space-x-2">
                  {setting.logo && (
                    <Image className="h-4 w-4 text-green-600" title="Com logo" />
                  )}
                  {setting.embaralhar_videos && (
                    <Activity className="h-4 w-4 text-blue-600" title="Embaralhar vídeos" />
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Resolução: {setting.resolucao} @ {setting.fps}fps</p>
                <p>Bitrate: {setting.bitrate} kbps</p>
                {setting.logo && (
                  <p>Logo: {setting.logo_posicao} ({setting.logo_opacidade}%)</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Formulário para nova configuração */}
        {showAdvancedSettings && (
          <form onSubmit={handleSaveAdvancedSettings} className="border-t pt-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-800">Nova Configuração de Transmissão</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Configuração
                </label>
                <input
                  type="text"
                  value={advancedSettingsForm.nome}
                  onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo
                </label>
                <select
                  value={advancedSettingsForm.id_logo}
                  onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, id_logo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Sem logo</option>
                  {logos.map((logo) => (
                    <option key={logo.id} value={logo.id}>
                      {logo.nome}
                    </option>
                  ))}
                </select>
              </div>

              {advancedSettingsForm.id_logo && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posição da Logo
                    </label>
                    <select
                      value={advancedSettingsForm.logo_posicao}
                      onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, logo_posicao: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="top-left">Superior Esquerdo</option>
                      <option value="top-right">Superior Direito</option>
                      <option value="bottom-left">Inferior Esquerdo</option>
                      <option value="bottom-right">Inferior Direito</option>
                      <option value="center">Centro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opacidade da Logo ({advancedSettingsForm.logo_opacidade}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={advancedSettingsForm.logo_opacidade}
                      onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, logo_opacidade: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tamanho da Logo
                    </label>
                    <select
                      value={advancedSettingsForm.logo_tamanho}
                      onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, logo_tamanho: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="small">Pequeno</option>
                      <option value="medium">Médio</option>
                      <option value="large">Grande</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolução
                </label>
                <select
                  value={advancedSettingsForm.resolucao}
                  onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, resolucao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="1440p">1440p (2K)</option>
                  <option value="4k">4K (Ultra HD)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FPS
                </label>
                <select
                  value={advancedSettingsForm.fps}
                  onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={24}>24 FPS</option>
                  <option value={30}>30 FPS</option>
                  <option value={60}>60 FPS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitrate (kbps)
                </label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  value={advancedSettingsForm.bitrate}
                  onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, bitrate: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedSettingsForm.embaralhar_videos}
                    onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, embaralhar_videos: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Embaralhar vídeos da playlist</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedSettingsForm.repetir_playlist}
                    onChange={(e) => setAdvancedSettingsForm(prev => ({ ...prev, repetir_playlist: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Repetir playlist</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Salvar Configuração
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Iniciar nova transmissão */}
      {!transmissionStatus.is_live && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar Nova Transmissão</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Transmissão *
                </label>
                <input
                  type="text"
                  value={transmissionForm.titulo}
                  onChange={(e) => setTransmissionForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite o título da transmissão"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist *
                </label>
                <select
                  value={selectedPlaylist}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Selecione uma playlist</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configurações de Transmissão (opcional)
                </label>
                <select
                  value={selectedSettings}
                  onChange={(e) => setSelectedSettings(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Configuração padrão</option>
                  {transmissionSettings.map((setting) => (
                    <option key={setting.id} value={setting.id}>
                      {setting.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={transmissionForm.descricao}
                onChange={(e) => setTransmissionForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Descrição da transmissão"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Plataformas *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userPlatforms.map((up) => {
                  const IconComponent = getIconComponent(up.platform.icone);
                  const isSelected = selectedPlatforms.includes(up.id);
                  
                  return (
                    <label
                      key={up.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms(prev => [...prev, up.id]);
                          } else {
                            setSelectedPlatforms(prev => prev.filter(id => id !== up.id));
                          }
                        }}
                        className="sr-only"
                      />
                      <IconComponent className="h-5 w-5 text-primary-600 mr-3" />
                      <span className="font-medium">{up.platform.nome}</span>
                    </label>
                  );
                })}
              </div>
              {userPlatforms.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Nenhuma plataforma configurada. Configure pelo menos uma plataforma acima.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleStartTransmission}
                disabled={loading || userPlatforms.length === 0}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Play className="h-5 w-5 mr-2" />
                {loading ? 'Iniciando...' : 'Iniciar Transmissão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Como usar</h3>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
            <p>Configure suas plataformas de streaming (YouTube, Facebook, etc.) com as chaves de transmissão</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
            <p>Envie logos e configure as opções de transmissão (posição, opacidade, embaralhar vídeos)</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
            <p>Selecione uma playlist, configure as opções desejadas e escolha as plataformas</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
            <p>Clique em "Iniciar Transmissão" e sua playlist será transmitida automaticamente para todas as plataformas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IniciarTransmissao;