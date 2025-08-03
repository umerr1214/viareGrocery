import config from '../config/environment';

class ApiService {
  constructor() {
    this.baseURL = config.apiBaseUrl;
    this.timeout = config.apiTimeout;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Path optimization
  async getOptimizedPath(products) {
    return this.request('/api/path', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  }

  // Product alternatives
  async getAlternatives(params) {
    return this.request('/api/alternatives', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Product suggestions
  async getSuggestions(files, category = '') {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `image_${index}.jpg`,
      });
    });
    
    if (category) {
      formData.append('category', category);
    }

    return this.request('/api/suggest-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }
}

export default new ApiService(); 