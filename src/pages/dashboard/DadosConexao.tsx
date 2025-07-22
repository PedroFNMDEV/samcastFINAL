import React, { useState, useEffect } from 'react';
import { ChevronLeft, Copy, Server, Wifi, Settings, Activity, Eye, EyeOff, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const DadosConexao: React.FC = () => {
  const { user } = useAuth();
  const [showFtpPassword, setShowFtpPassword] = useState(false);
  
  const userLogin = user?.email?.split('@')[0] || 'usuario';
  
  // Dados de conexão para OBS/Streamlabs (sem expor dados do Wowza)
  const connectionData = {
    serverUrl: 'streaming.exemplo.com',
    port: '1935',
    application: 'live',
    streamName: `${userLogin}_stream`,
    rtmpUrl: `rtmp://streaming.exemplo.com:1935/live`,
    streamKey: `${userLogin}_${Date.now()}`,
    hlsUrl: `https://streaming.exemplo.com/live/${userLogin}_stream/playlist.m3u8`
  };

  // Dados de conexão FTP reais baseados no código PHP
  const ftpData = {
    servidor: '51.222.156.223', // IP real do servidor
    usuario: userLogin, // Login do usuário baseado no email
    senha: 'Adr1an@2024!', // Senha real do sistema
    porta: '21' // Porta padrão FTP
  };

  // Dados do servidor FMS/RTMP real
  const fmsData = {
    servidor: 'stmv1.udicast.com',
    porta: '1935',
    aplicacao: 'samhost',
    rtmpUrl: 'rtmp://stmv1.udicast.com:1935/samhost',
    usuario: userLogin,
    streamKey: `${userLogin}_live`,
    hlsUrl: `http://stmv1.udicast.com:1935/samhost/${userLogin}_live/playlist.m3u8`
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link to="/dashboard" className="flex items-center text-primary-600 hover:text-primary-800">
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        <Server className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Dados de Conexão</h1>
      </div>

      {/* Servidor FMS/RTMP Principal */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
        <div className="flex items-center space-x-2 mb-6">
          <Radio className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Servidor FMS/RTMP Principal</h2>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">PRINCIPAL</span>
        </div>
        
        {/* Tabela estilizada como no código PHP original */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody className="bg-gray-50">
              {/* Servidor/Server/Host */}
              <tr className="border-b border-gray-200">
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  Servidor/Server/Host
                </td>
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center">
                    <span 
                      id="dados_fms_url" 
                      className="text-gray-900 font-mono text-sm"
                    >
                      {fmsData.servidor}
                    </span>
                    <button 
                      className="ml-2 text-primary-600 hover:text-primary-800"
                      onClick={() => copyToClipboard(fmsData.servidor, 'Servidor FMS')}
                      title="Copiar/Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Usuário */}
              <tr className="border-b border-gray-200">
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  Usuário
                </td>
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center">
                    <span 
                      id="dados_fms_login" 
                      className="text-gray-900 font-mono text-sm"
                    >
                      {fmsData.usuario}
                    </span>
                    <button 
                      className="ml-2 text-primary-600 hover:text-primary-800"
                      onClick={() => copyToClipboard(fmsData.usuario, 'Usuário FMS')}
                      title="Copiar/Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Porta RTMP */}
              <tr className="border-b border-gray-200">
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  Porta RTMP
                </td>
                <td className="px-3 py-2 text-left">
                  <span className="text-gray-900 font-mono text-sm">
                    {fmsData.porta}
                  </span>
                </td>
              </tr>

              {/* Aplicação */}
              <tr className="border-b border-gray-200">
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  Aplicação
                </td>
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center">
                    <span 
                      id="dados_fms_app" 
                      className="text-gray-900 font-mono text-sm"
                    >
                      {fmsData.aplicacao}
                    </span>
                    <button 
                      className="ml-2 text-primary-600 hover:text-primary-800"
                      onClick={() => copyToClipboard(fmsData.aplicacao, 'Aplicação')}
                      title="Copiar/Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {/* URL RTMP Completa */}
              <tr>
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  URL RTMP Completa
                </td>
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center">
                    <span 
                      id="dados_fms_rtmp" 
                      className="text-gray-900 font-mono text-sm"
                    >
                      {fmsData.rtmpUrl}
                    </span>
                    <button 
                      className="ml-2 text-primary-600 hover:text-primary-800"
                      onClick={() => copyToClipboard(fmsData.rtmpUrl, 'URL RTMP')}
                      title="Copiar/Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Informações adicionais do FMS */}
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-medium text-red-900 mb-2">📡 Servidor FMS Principal</h3>
          <div className="text-red-800 text-sm space-y-1">
            <p>• <strong>URL para OBS/Streamlabs:</strong> {fmsData.rtmpUrl}</p>
            <p>• <strong>Stream Key:</strong> {fmsData.streamKey}</p>
            <p>• <strong>URL de Visualização (HLS):</strong> {fmsData.hlsUrl}</p>
            <p>• Este é o servidor principal para transmissões ao vivo</p>
          </div>
        </div>
      </div>

      {/* Dados de Conexão FTP - Exatamente como no PHP */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Server className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-800">Dados de Conexão FTP</h2>
        </div>
        
        {/* Tabela estilizada como no código PHP original */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody className="bg-gray-50">
              {/* Servidor/Server/Host */}
              <tr className="border-b border-gray-200">
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  Servidor/Server/Host
                </td>
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center">
                    <span 
                      id="dados_ftp_url" 
                      className="text-gray-900 font-mono text-sm"
                    >
                      {ftpData.servidor}
                    </span>
                    <button 
                      className="ml-2 text-primary-600 hover:text-primary-800"
                      onClick={() => copyToClipboard(ftpData.servidor, 'Servidor FTP')}
                      title="Copiar/Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Usuário */}
              <tr className="border-b border-gray-200">
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  Usuário
                </td>
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center">
                    <span 
                      id="dados_ftp_login" 
                      className="text-gray-900 font-mono text-sm"
                    >
                      {ftpData.usuario}
                    </span>
                    <button 
                      className="ml-2 text-primary-600 hover:text-primary-800"
                      onClick={() => copyToClipboard(ftpData.usuario, 'Usuário FTP')}
                      title="Copiar/Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Senha */}
              <tr className="border-b border-gray-200">
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  Senha
                </td>
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center">
                    <div className="relative">
                      <span 
                        id="dados_ftp_senha" 
                        className="text-gray-900 font-mono text-sm mr-2"
                      >
                        {showFtpPassword ? ftpData.senha : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => setShowFtpPassword(!showFtpPassword)}
                        className="text-gray-400 hover:text-gray-600 mr-2"
                        title={showFtpPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showFtpPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button 
                      className="text-primary-600 hover:text-primary-800"
                      onClick={() => copyToClipboard(ftpData.senha, 'Senha FTP')}
                      title="Copiar/Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Porta FTP */}
              <tr>
                <td className="w-40 h-8 px-3 py-2 text-left font-medium text-gray-700 bg-gray-100">
                  Porta FTP
                </td>
                <td className="px-3 py-2 text-left">
                  <span className="text-gray-900 font-mono text-sm">
                    {ftpData.porta}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Informações adicionais */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Informações de Acesso FTP</h3>
          <div className="text-blue-800 text-sm space-y-1">
            <p>• Use estes dados para conectar via cliente FTP (FileZilla, WinSCP, etc.)</p>
            <p>• Também pode ser usado na ferramenta de migração de vídeos</p>
            <p>• Porta padrão: 21 (FTP não seguro)</p>
            <p>• Servidor: {ftpData.servidor}</p>
          </div>
        </div>
      </div>

      {/* URLs de Transmissão */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Wifi className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">URLs de Transmissão</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">URL do Servidor FMS (Para OBS/Streamlabs)</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {fmsData.rtmpUrl}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => copyToClipboard(fmsData.rtmpUrl, 'URL do Servidor FMS')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Chave de Transmissão (Stream Key)</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {fmsData.streamKey}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => copyToClipboard(fmsData.streamKey, 'Chave de Transmissão')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">URL de Visualização (HLS)</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {fmsData.hlsUrl}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => copyToClipboard(fmsData.hlsUrl, 'URL de Visualização')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Configurações Recomendadas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">Configurações Recomendadas</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">OBS Studio</h3>
            <p className="text-gray-600 mb-4">Configurações recomendadas para transmissão com OBS Studio</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Servidor: <span className="font-medium font-mono">{fmsData.rtmpUrl}</span></li>
                <li>Chave de transmissão: <span className="font-medium font-mono">{fmsData.streamKey}</span></li>
                <li>Taxa de bits de vídeo: <span className="font-medium">2500-5000 Kbps</span></li>
                <li>Taxa de bits de áudio: <span className="font-medium">128-320 Kbps</span></li>
                <li>Resolução: <span className="font-medium">1920x1080 (1080p) ou 1280x720 (720p)</span></li>
                <li>FPS: <span className="font-medium">30 ou 60</span></li>
                <li>Preset de codificação: <span className="font-medium">veryfast ou fast</span></li>
                <li>Perfil: <span className="font-medium">main ou high</span></li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Streamlabs</h3>
            <p className="text-gray-600 mb-4">Configurações recomendadas para transmissão com Streamlabs</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Servidor: <span className="font-medium font-mono">{fmsData.rtmpUrl}</span></li>
                <li>Chave de transmissão: <span className="font-medium font-mono">{fmsData.streamKey}</span></li>
                <li>Taxa de bits de vídeo: <span className="font-medium">2500-5000 Kbps</span></li>
                <li>Taxa de bits de áudio: <span className="font-medium">128-320 Kbps</span></li>
                <li>Resolução: <span className="font-medium">1920x1080 (1080p) ou 1280x720 (720p)</span></li>
                <li>FPS: <span className="font-medium">30 ou 60</span></li>
                <li>Preset de codificação: <span className="font-medium">veryfast ou fast</span></li>
                <li>Perfil: <span className="font-medium">main ou high</span></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Qualidade de Transmissão</h3>
            <p className="text-gray-600 mb-4">Configurações baseadas na sua conexão de internet</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <h4 className="font-medium text-gray-800">Básica</h4>
                  <p className="text-sm text-gray-600">720p @ 30fps</p>
                  <p className="text-sm text-gray-600">1500-2500 Kbps</p>
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-gray-800">Boa</h4>
                  <p className="text-sm text-gray-600">1080p @ 30fps</p>
                  <p className="text-sm text-gray-600">2500-4000 Kbps</p>
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-gray-800">Excelente</h4>
                  <p className="text-sm text-gray-600">1080p @ 60fps</p>
                  <p className="text-sm text-gray-600">4000-6000 Kbps</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Instruções de Uso</h3>
        <div className="space-y-2 text-blue-800">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
            <p>Configure seu OBS/Streamlabs com os dados do servidor FMS principal</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
            <p>Use os dados FTP para migrar vídeos de outros servidores</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
            <p>Inicie a transmissão no seu software primeiro</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
            <p>Em seguida, configure as plataformas desejadas na seção "Iniciar Transmissão"</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</div>
            <p>Monitore as estatísticas em tempo real no dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DadosConexao;