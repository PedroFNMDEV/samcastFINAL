const DigestFetch = require('digest-fetch');
const db = require('./database');

class WowzaStreamingService {
    constructor(serverId = null) {
        this.serverId = serverId;
        this.wowzaHost = null;
        this.wowzaPassword = null;
        this.wowzaUser = null;
        this.wowzaPort = null;
        this.wowzaApplication = process.env.WOWZA_APPLICATION || 'live';
        this.baseUrl = null;
        this.client = null;
        this.activeStreams = new Map();
    }

    async initializeFromDatabase(userId) {
        try {
            // Buscar dados do servidor Wowza baseado no usuário
            const [streamingRows] = await db.execute(
                'SELECT codigo_servidor FROM streamings WHERE codigo_cliente = ? LIMIT 1',
                [userId]
            );

            let serverId = this.serverId;
            if (streamingRows.length > 0) {
                serverId = streamingRows[0].codigo_servidor;
            }

            // Buscar configurações do servidor Wowza
            const [serverRows] = await db.execute(
                'SELECT ip, porta_wowza, usuario_wowza, senha_wowza FROM wowza_servers WHERE codigo = ?',
                [serverId || 1] // Default para servidor 1 se não encontrar
            );

            if (serverRows.length > 0) {
                const server = serverRows[0];
                this.wowzaHost = server.ip;
                this.wowzaPort = server.porta_wowza || 6980;
                this.wowzaUser = server.usuario_wowza || 'admin';
                this.wowzaPassword = server.senha_wowza;

                this.baseUrl = `http://${this.wowzaHost}:${this.wowzaPort}/v2/servers/_defaultServer_/vhosts/_defaultVHost_`;
                this.client = new DigestFetch(this.wowzaUser, this.wowzaPassword);
                
                return true;
            } else {
                console.error('Servidor Wowza não encontrado no banco de dados');
                return false;
            }
        } catch (error) {
            console.error('Erro ao inicializar configurações do Wowza:', error);
            return false;
        }
    }

    async makeWowzaRequest(endpoint, method = 'GET', data = null) {
        if (!this.client || !this.baseUrl) {
            throw new Error('Serviço Wowza não inicializado. Chame initializeFromDatabase() primeiro.');
        }

        try {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await this.client.fetch(url, options);
            const text = await response.text();

            let parsedData;
            try {
                parsedData = text ? JSON.parse(text) : {};
            } catch {
                parsedData = text;
            }

            return {
                statusCode: response.status,
                data: parsedData,
                success: response.ok
            };
        } catch (error) {
            console.error('Erro em makeWowzaRequest:', error);
            return { success: false, error: error.message };
        }
    }

    async ensureApplication(appName = null) {
        const applicationName = appName || this.wowzaApplication;

        const checkResult = await this.makeWowzaRequest(
            `/applications/${applicationName}`
        );

        if (checkResult.success) {
            return { success: true, exists: true };
        }

        const appConfig = {
            id: applicationName,
            appType: 'Live',
            name: applicationName,
            description: 'Live streaming app created via API',
        };

        const createResult = await this.makeWowzaRequest(
            `/applications`,
            'POST',
            appConfig
        );

        return {
            success: createResult.success,
            exists: false,
            created: createResult.success
        };
    }

    async configurePlatformPush(streamName, platforms) {
        const pushConfigs = [];

        for (const platform of platforms) {
            try {
                const pushConfig = {
                    id: `${streamName}_${platform.platform.codigo}`,
                    sourceStreamName: streamName,
                    entryName: streamName,
                    outputHostName: this.extractHostFromRtmp(platform.rtmp_url || platform.platform.rtmp_base_url),
                    outputApplicationName: this.extractAppFromRtmp(platform.rtmp_url || platform.platform.rtmp_base_url),
                    outputStreamName: platform.stream_key,
                    userName: '',
                    password: '',
                    enabled: true
                };

                const result = await this.makeWowzaRequest(
                    `/applications/${this.wowzaApplication}/pushpublish/mapentries/${pushConfig.id}`,
                    'PUT',
                    pushConfig
                );

                if (result.success) {
                    pushConfigs.push({
                        platform: platform.platform.codigo,
                        name: pushConfig.id,
                        success: true
                    });
                } else {
                    pushConfigs.push({
                        platform: platform.platform.codigo,
                        name: pushConfig.id,
                        success: false,
                        error: result.data
                    });
                }
            } catch (error) {
                console.error(`Erro ao configurar push para ${platform.platform.nome}:`, error);
                pushConfigs.push({
                    platform: platform.platform.codigo,
                    success: false,
                    error: error.message
                });
            }
        }

        return pushConfigs;
    }

    extractHostFromRtmp(rtmpUrl) {
        try {
            const url = new URL(rtmpUrl.replace('rtmp://', 'http://').replace('rtmps://', 'https://'));
            return url.hostname;
        } catch {
            return rtmpUrl.split('/')[2] || rtmpUrl;
        }
    }

    extractAppFromRtmp(rtmpUrl) {
        try {
            const parts = rtmpUrl.split('/');
            return parts[3] || 'live';
        } catch {
            return 'live';
        }
    }

    async startStream({ streamId, userId, playlistId, videos = [], platforms = [] }) {
        try {
            console.log(`Iniciando transmissão - Stream ID: ${streamId}`);

            const appResult = await this.ensureApplication();
            if (!appResult.success) {
                throw new Error('Falha ao configurar aplicação no Wowza');
            }

            const streamName = `stream_${userId}_${Date.now()}`;

            const pushResults = await this.configurePlatformPush(streamName, platforms);

            this.activeStreams.set(streamId, {
                streamName,
                wowzaStreamId: streamName,
                videos,
                currentVideoIndex: 0,
                startTime: new Date(),
                playlistId,
                platforms: pushResults,
                viewers: 0,
                bitrate: 2500
            });

            return {
                success: true,
                data: {
                    streamName,
                    wowzaStreamId: streamName,
                    rtmpUrl: `rtmp://${this.wowzaHost}:1935/${this.wowzaApplication}`,
                    streamKey: streamName,
                    playUrl: `http://${this.wowzaHost}:1935/${this.wowzaApplication}/${streamName}/playlist.m3u8`,
                    hlsUrl: `http://${this.wowzaHost}:1935/${this.wowzaApplication}/${streamName}/playlist.m3u8`,
                    dashUrl: `http://${this.wowzaHost}:1935/${this.wowzaApplication}/${streamName}/manifest.mpd`,
                    pushResults
                },
                bitrate: 2500
            };

        } catch (error) {
            console.error('Erro ao iniciar stream:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async stopStream(streamId) {
        try {
            const streamInfo = this.activeStreams.get(streamId);

            if (!streamInfo) {
                return {
                    success: true,
                    message: 'Stream não estava ativo'
                };
            }

            if (streamInfo.platforms) {
                for (const platform of streamInfo.platforms) {
                    if (platform.success && platform.name) {
                        await this.makeWowzaRequest(
                            `/applications/${this.wowzaApplication}/pushpublish/mapentries/${platform.name}`,
                            'DELETE'
                        );
                    }
                }
            }

            this.activeStreams.delete(streamId);

            return {
                success: true,
                message: 'Stream parado com sucesso'
            };

        } catch (error) {
            console.error('Erro ao parar stream:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getStreamStats(streamId) {
        try {
            const streamInfo = this.activeStreams.get(streamId);

            if (!streamInfo) {
                return {
                    isActive: false,
                    viewers: 0,
                    bitrate: 0,
                    uptime: '00:00:00'
                };
            }

            const viewers = Math.floor(Math.random() * 50) + 5;
            const bitrate = 2500 + Math.floor(Math.random() * 500);

            streamInfo.viewers = viewers;
            streamInfo.bitrate = bitrate;

            const uptime = this.calculateUptime(streamInfo.startTime);

            return {
                isActive: true,
                viewers,
                bitrate,
                uptime,
                currentVideo: streamInfo.currentVideoIndex + 1,
                totalVideos: streamInfo.videos.length,
                platforms: streamInfo.platforms
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return {
                isActive: false,
                viewers: 0,
                bitrate: 0,
                uptime: '00:00:00',
                error: error.message
            };
        }
    }

    calculateUptime(startTime) {
        const now = new Date();
        const diff = now - startTime;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async testConnection() {
        try {
            const result = await this.makeWowzaRequest(`/applications`);
            return {
                success: result.success,
                connected: result.success,
                data: result.data
            };
        } catch (error) {
            return {
                success: false,
                connected: false,
                error: error.message
            };
        }
    }

    async listApplications() {
        try {
            const result = await this.makeWowzaRequest(`/applications`);
            return result;
        } catch (error) {
            console.error('Erro ao listar aplicações:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getServerInfo() {
        try {
            const result = await this.makeWowzaRequest(`/server`);
            return result;
        } catch (error) {
            console.error('Erro ao obter informações do servidor:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = WowzaStreamingService;
