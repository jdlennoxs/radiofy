
export class MockSpotifyClient {
    private _accessToken: string | null = null;
    private _volume: number = 50;
    private _isPlaying: boolean = false;
    private _savedTracks: Set<string> = new Set();

    constructor() { }

    setAccessToken(token: string) {
        this._accessToken = token;
    }

    // Devices
    async getMyDevices() {
        return {
            body: {
                devices: [
                    {
                        id: "mock-device-id",
                        is_active: true,
                        is_private_session: false,
                        is_restricted: false,
                        name: "Mock Device",
                        type: "Computer",
                        volume_percent: this._volume,
                    },
                ],
            },
        };
    }

    // Playlists
    async getUserPlaylists(options?: { limit?: number }) {
        return {
            body: {
                href: "https://api.spotify.com/v1/users/mock-user/playlists",
                limit: options?.limit || 20,
                next: null,
                offset: 0,
                previous: null,
                total: 1,
                items: [
                    {
                        collaborative: false,
                        description: "A mock playlist for testing",
                        external_urls: { spotify: "https://open.spotify.com/playlist/mock" },
                        href: "https://api.spotify.com/v1/playlists/mock-playlist-id",
                        id: "mock-playlist-id",
                        images: [],
                        name: "Mock Playlist",
                        owner: {
                            display_name: "Mock User",
                            external_urls: { spotify: "https://open.spotify.com/user/mock-user" },
                            href: "https://api.spotify.com/v1/users/mock-user",
                            id: "mock-user",
                            type: "user",
                            uri: "spotify:user:mock-user",
                        },
                        public: true,
                        snapshot_id: "mock-snapshot",
                        tracks: {
                            href: "https://api.spotify.com/v1/playlists/mock-playlist-id/tracks",
                            total: 5,
                        },
                        type: "playlist",
                        uri: "spotify:playlist:mock-playlist-id",
                    },
                ],
            },
        };
    }

    async getPlaylist(playlistId: string) {
        return {
            body: {
                collaborative: false,
                description: "A mock playlist for testing",
                external_urls: { spotify: "https://open.spotify.com/playlist/mock" },
                followers: { href: null, total: 0 },
                href: `https://api.spotify.com/v1/playlists/${playlistId}`,
                id: playlistId,
                images: [],
                name: "Mock Playlist Details",
                owner: {
                    display_name: "Mock User",
                    external_urls: { spotify: "https://open.spotify.com/user/mock-user" },
                    href: "https://api.spotify.com/v1/users/mock-user",
                    id: "mock-user",
                    type: "user",
                    uri: "spotify:user:mock-user",
                },
                public: true,
                snapshot_id: "mock-snapshot",
                tracks: {
                    href: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                    limit: 100,
                    next: null,
                    offset: 0,
                    previous: null,
                    total: 1,
                    items: [
                        {
                            added_at: "2023-01-01T00:00:00Z",
                            added_by: {
                                external_urls: { spotify: "https://open.spotify.com/user/mock-user" },
                                href: "https://api.spotify.com/v1/users/mock-user",
                                id: "mock-user",
                                type: "user",
                                uri: "spotify:user:mock-user"
                            },
                            is_local: false,
                            track: {
                                album: {
                                    album_type: "album",
                                    artists: [{
                                        external_urls: { spotify: "https://open.spotify.com/artist/mock-artist" },
                                        href: "https://api.spotify.com/v1/artists/mock-artist",
                                        id: "mock-artist",
                                        name: "Mock Artist",
                                        type: "artist",
                                        uri: "spotify:artist:mock-artist"
                                    }],
                                    external_urls: { spotify: "https://open.spotify.com/album/mock-album" },
                                    href: "https://api.spotify.com/v1/albums/mock-album",
                                    id: "mock-album",
                                    images: [],
                                    name: "Mock Album",
                                    release_date: "2023-01-01",
                                    release_date_precision: "day",
                                    total_tracks: 10,
                                    type: "album",
                                    uri: "spotify:album:mock-album"
                                },
                                artists: [{
                                    external_urls: { spotify: "https://open.spotify.com/artist/mock-artist" },
                                    href: "https://api.spotify.com/v1/artists/mock-artist",
                                    id: "mock-artist",
                                    name: "Mock Artist",
                                    type: "artist",
                                    uri: "spotify:artist:mock-artist"
                                }],
                                disc_number: 1,
                                duration_ms: 180000,
                                explicit: false,
                                external_ids: { isrc: "mock-isrc" },
                                external_urls: { spotify: "https://open.spotify.com/track/mock-track" },
                                href: "https://api.spotify.com/v1/tracks/mock-track",
                                id: "mock-track",
                                is_local: false,
                                is_playable: true,
                                name: "Mock Track",
                                popularity: 50,
                                preview_url: null,
                                track_number: 1,
                                type: "track",
                                uri: "spotify:track:mock-track",
                            }
                        }
                    ],
                },
                type: "playlist",
                uri: `spotify:playlist:${playlistId}`,
            },
        };
    }

    // Saved Tracks
    async containsMySavedTracks(ids: string[]) {
        return {
            body: ids.map((id) => this._savedTracks.has(id)),
        };
    }

    async addToMySavedTracks(ids: string[]) {
        ids.forEach(id => this._savedTracks.add(id));
        return { body: {} };
    }

    async removeFromMySavedTracks(ids: string[]) {
        ids.forEach(id => this._savedTracks.delete(id));
        return { body: {} };
    }

    // Playback
    async getMyCurrentPlaybackState() {
        if (!this._isPlaying) {
            return { body: null }; // Or empty object if that's what the API returns when nothing is playing, but null is common
        }

        return {
            body: {
                device: {
                    id: "mock-device-id",
                    is_active: true,
                    is_private_session: false,
                    is_restricted: false,
                    name: "Mock Device",
                    type: "Computer",
                    volume_percent: this._volume
                },
                repeat_state: "off",
                shuffle_state: false,
                context: null,
                timestamp: Date.now(),
                progress_ms: 1000,
                is_playing: this._isPlaying,
                item: {
                    album: {
                        album_type: "album",
                        artists: [{
                            external_urls: { spotify: "https://open.spotify.com/artist/mock-artist" },
                            href: "https://api.spotify.com/v1/artists/mock-artist",
                            id: "mock-artist",
                            name: "Mock Artist",
                            type: "artist",
                            uri: "spotify:artist:mock-artist"
                        }],
                        external_urls: { spotify: "https://open.spotify.com/album/mock-album" },
                        href: "https://api.spotify.com/v1/albums/mock-album",
                        id: "mock-album",
                        images: [],
                        name: "Mock Album",
                        release_date: "2023-01-01",
                        release_date_precision: "day",
                        total_tracks: 10,
                        type: "album",
                        uri: "spotify:album:mock-album"
                    },
                    artists: [{
                        external_urls: { spotify: "https://open.spotify.com/artist/mock-artist" },
                        href: "https://api.spotify.com/v1/artists/mock-artist",
                        id: "mock-artist",
                        name: "Mock Artist",
                        type: "artist",
                        uri: "spotify:artist:mock-artist"
                    }],
                    disc_number: 1,
                    duration_ms: 180000,
                    explicit: false,
                    external_ids: { isrc: "mock-isrc" },
                    external_urls: { spotify: "https://open.spotify.com/track/mock-track" },
                    href: "https://api.spotify.com/v1/tracks/mock-track",
                    id: "mock-track",
                    is_local: false,
                    is_playable: true,
                    name: "Mock Track",
                    popularity: 50,
                    preview_url: null,
                    track_number: 1,
                    type: "track",
                    uri: "spotify:track:mock-track",
                },
                currently_playing_type: "track",
                actions: {
                    disallows: {
                        resuming: true
                    }
                }
            }
        }
    }

    async play(options?: { uris?: string[] }) {
        this._isPlaying = true;
        return { body: {} };
    }

    async pause() {
        this._isPlaying = false;
        return { body: {} };
    }

    async transferMyPlayback(deviceIds: string[]) {
        return { body: {} };
    }

    async setVolume(volumePercent: number) {
        this._volume = volumePercent;
        return { body: {} };
    }

    async searchTracks(query: string) {
        return {
            body: {
                tracks: {
                    href: "https://api.spotify.com/v1/search/mock",
                    items: [
                        {
                            album: {
                                album_type: "album",
                                artists: [{
                                    external_urls: { spotify: "https://open.spotify.com/artist/mock-artist" },
                                    href: "https://api.spotify.com/v1/artists/mock-artist",
                                    id: "mock-artist",
                                    name: "Mock Artist",
                                    type: "artist",
                                    uri: "spotify:artist:mock-artist"
                                }],
                                external_urls: { spotify: "https://open.spotify.com/album/mock-album" },
                                href: "https://api.spotify.com/v1/albums/mock-album",
                                id: "mock-album",
                                images: [],
                                name: "Mock Album",
                                release_date: "2023-01-01",
                                release_date_precision: "day",
                                total_tracks: 10,
                                type: "album",
                                uri: "spotify:album:mock-album"
                            },
                            artists: [{
                                external_urls: { spotify: "https://open.spotify.com/artist/mock-artist" },
                                href: "https://api.spotify.com/v1/artists/mock-artist",
                                id: "mock-artist",
                                name: "Mock Artist",
                                type: "artist",
                                uri: "spotify:artist:mock-artist"
                            }],
                            disc_number: 1,
                            duration_ms: 180000,
                            explicit: false,
                            external_ids: { isrc: "mock-isrc" },
                            external_urls: { spotify: "https://open.spotify.com/track/mock-track" },
                            href: "https://api.spotify.com/v1/tracks/mock-track",
                            id: "mock-track",
                            is_local: false,
                            is_playable: true,
                            name: `Result for ${query}`,
                            popularity: 50,
                            preview_url: null,
                            track_number: 1,
                            type: "track",
                            uri: "spotify:track:mock-track",
                        }
                    ],
                    limit: 20,
                    next: null,
                    offset: 0,
                    previous: null,
                    total: 1
                }
            }
        }
    }
}

export const mockSpotifyApi = new MockSpotifyClient();
