import { api } from '@/lib/api';

// Types
export interface Screen {
  width: number;
  height: number;
  colorDepth: number;
}

export interface Window {
  innerWidth?: number;
  innerHeight?: number;
  outerWidth?: number;
  outerHeight?: number;
}

/**
 * Proxy configuration for browser profiles
 *
 * Note: This structure must match the backend's ProxyConfig model.
 * The server field should contain the full proxy server address (e.g., 'http://proxy.example.com:8080')
 * Username and password are optional and should be provided separately (not embedded in the URL)
 * to prevent 407 Proxy Authentication errors.
 *
 * The protocol, host, and port fields are used for UI purposes only and are not sent to the server.
 * They are combined to create the server field which is what the server actually uses.
 */
export interface ProxyConfig {
  // This is the field that gets sent to the server
  server: string;

  // These fields are for UI purposes only and don't get sent to the server
  protocol?: 'http' | 'https' | 'socks4' | 'socks5';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

export interface Geolocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ProfileConfigCreate {
  os?: string;
  browser?: string;
  screen?: Screen;
  humanize?: boolean;
  block_webrtc?: boolean;
  geoip?: boolean;
  locale?: string;
  proxy?: ProxyConfig;
}

export interface ProfileCreate {
  name?: string;
  config?: ProfileConfigCreate;
}

export interface ProfileUpdate {
  name?: string;
  config?: ProfileConfigCreate;
  regenerate_fingerprint?: boolean;
}

export interface FingerprintData {
  navigator?: {
    userAgent?: string;
    doNotTrack?: string;
    appCodeName?: string;
    appName?: string;
    appVersion?: string;
    oscpu?: string;
    language?: string;
    languages?: string[];
    platform?: string;
    hardwareConcurrency?: number;
    product?: string;
    productSub?: string;
    maxTouchPoints?: number;
    cookieEnabled?: boolean;
    globalPrivacyControl?: boolean;
    buildID?: string;
    onLine?: boolean;
    [key: string]: any; // Allow for other properties
  };
  screen?: {
    availHeight?: number;
    availWidth?: number;
    availTop?: number;
    availLeft?: number;
    height?: number;
    width?: number;
    colorDepth?: number;
    pixelDepth?: number;
    pageXOffset?: number;
    pageYOffset?: number;
    [key: string]: any; // Allow for other properties
  };
  window?: {
    scrollMinX?: number;
    scrollMinY?: number;
    scrollMaxX?: number;
    scrollMaxY?: number;
    outerHeight?: number;
    outerWidth?: number;
    innerHeight?: number;
    innerWidth?: number;
    screenX?: number;
    screenY?: number;
    devicePixelRatio?: number;
    [key: string]: any; // Allow for other properties
  };
  webgl?: {
    vendor?: string;
    renderer?: string;
    version?: string;
    shadingLanguageVersion?: string;
    [key: string]: any; // Allow for other properties
  };
  note?: string;
  [key: string]: any; // Allow for other categories
}

export interface Profile {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  fingerprint?: FingerprintData;
  config: Record<string, any>;
  path: string;
  metadata: Record<string, any>;
}

export interface ProfileStats {
  id: string;
  name: string;
  created_at: string;
  age_days: number;
  last_access?: string;
  last_access_days?: number;
  fingerprint_complexity: number;
  profile_size_bytes: number;
  profile_size_mb: number;
}

export interface ProfileValidation {
  id: string;
  name: string;
  is_valid: boolean;
  issues: string[];
  warnings: string[];
}

export interface BatchProfileCreate {
  count: number;
  base_config?: ProfileConfigCreate;
  name_prefix?: string;
  ensure_diversity: boolean;
}

export interface BatchProfileResponse {
  created_profiles: Profile[];
  failed_count: number;
}

/**
 * Profiles API client for interacting with the profiles endpoints
 */
export const profilesApi = {
  /**
   * Create a new browser profile
   */
  create: async (profileData: ProfileCreate): Promise<Profile> => {
    return api.post('/api/profiles', profileData);
  },

  /**
   * Get a list of profiles
   */
  list: async (): Promise<Profile[]> => {
    return api.get('/api/profiles');
  },

  /**
   * Get a specific profile by ID
   */
  get: async (profileId: string): Promise<Profile> => {
    return api.get(`/api/profiles/${profileId}`);
  },

  /**
   * Update a profile with new values
   */
  update: async (
    profileId: string,
    updateData: ProfileUpdate
  ): Promise<Profile> => {
    return api.put(`/api/profiles/${profileId}`, updateData);
  },

  /**
   * Delete a profile
   */
  delete: async (profileId: string): Promise<void> => {
    return api.delete(`/api/profiles/${profileId}`);
  },

  /**
   * Search for profiles by name or other properties
   */
  search: async (query: string): Promise<Profile[]> => {
    return api.get(`/api/profiles/search?query=${encodeURIComponent(query)}`);
  },

  /**
   * Get detailed statistics for a profile
   */
  getStats: async (profileId: string): Promise<ProfileStats> => {
    return api.get(`/api/profiles/${profileId}/stats`);
  },

  /**
   * Get the actual fingerprint for a profile with all properties
   */
  getFingerprint: async (profileId: string): Promise<FingerprintData> => {
    return api.get(`/api/profiles/${profileId}/fingerprint`);
  },


  /**
   * Create multiple unique profiles at once
   */
  createBatch: async (batchConfig: BatchProfileCreate): Promise<BatchProfileResponse> => {
    return api.post('/api/profiles/batch', batchConfig);
  },

  /**
   * Launch a browser with the specified profile
   *
   * @param profileId - The ID of the profile to launch
   * @param options - Launch options
   * @param options.headless - Whether to launch in headless mode (default: false)
   * @param options.useProxy - Whether to use the profile's proxy configuration (default: true)
   * @param options.geoip - Whether to enable geolocation spoofing (default: true)
   * @param options.humanize - Whether to enable human-like behavior (default: true)
   */
  launch: async (
    profileId: string,
    options: {
      headless?: boolean;
      useProxy?: boolean;
      geoip?: boolean;
      humanize?: boolean;
    } = {}
  ): Promise<Record<string, any>> => {
    const params = new URLSearchParams();

    // Set default values if not provided
    params.set('headless', String(options.headless ?? false));
    params.set('use_proxy', String(options.useProxy ?? true));

    // Add optional parameters if provided
    if (options.geoip !== undefined) params.set('geoip', String(options.geoip));
    if (options.humanize !== undefined) params.set('humanize', String(options.humanize));

    return api.post(`/api/profiles/${profileId}/launch?${params.toString()}`);
  },

  /**
   * Set a custom browser configuration for a profile
   *
   * This is useful for testing and debugging. The configuration will be used
   * the next time the profile is launched.
   *
   * @param profileId - The ID of the profile to configure
   * @param config - The browser configuration to set
   */
  setBrowserConfig: async (
    profileId: string,
    config: Record<string, any>
  ): Promise<Record<string, any>> => {
    return api.post(`/api/profiles/${profileId}/browser-config`, config);
  },

  /**
   * Close a browser instance for the specified profile
   */
  closeBrowser: async (profileId: string): Promise<Record<string, any>> => {
    return api.post(`/api/profiles/${profileId}/close`);
  },

  /**
   * Export a profile as a JSON file
   */
  export: async (profileId: string): Promise<void> => {
    const profile = await profilesApi.get(profileId);

    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile-${profileId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Import a profile from a JSON file
   */
  import: async (file: File): Promise<Profile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const profileData = JSON.parse(event.target?.result as string);

          // Convert the imported data to the new format
          const createData: ProfileCreate = {
            name: `Imported: ${profileData.name || 'Profile'}`,
            config: {
              os: profileData.fingerprint?.platform || profileData.config?.os,
              browser: profileData.config?.browser,
              screen: profileData.fingerprint?.screen || profileData.config?.screen,
              humanize: profileData.config?.humanize ?? true,
              block_webrtc: profileData.config?.block_webrtc ?? true,
              geoip: profileData.config?.geoip ?? true,
              locale: profileData.config?.locale,
              proxy: profileData.config?.proxy
            }
          };

          const newProfile = await profilesApi.create(createData);
          resolve(newProfile);
        } catch (error) {
          reject(new Error('Invalid profile data in the imported file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read the imported file'));
      };

      reader.readAsText(file);
    });
  }
};
