import BASE_URL from '../config/api.js';

class TicTacToeAPI {
  constructor() {
    this.baseURL = BASE_URL;
    this.sessionId = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/tictactoe${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async startGame() {
    try {
      const response = await this.request('/start', {
        method: 'POST',
      });
      this.sessionId = response.session_id;
      return response;
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }

  async makeMove(board) {
    if (!this.sessionId) {
      throw new Error('No active session. Call startGame() first.');
    }

    try {
      const response = await this.request('/move', {
        method: 'POST',
        body: JSON.stringify({
          session_id: this.sessionId,
          board: board,
        }),
        credentials: 'include', // Include cookies for session management
      });
      return response;
    } catch (error) {
      console.error('Failed to make move:', error);
      throw error;
    }
  }

  async endGame(result) {
    if (!this.sessionId) {
      console.warn('No active session to end');
      return null;
    }

    try {
      const response = await this.request('/end', {
        method: 'POST',
        body: JSON.stringify({
          session_id: this.sessionId,
          result: result, // 'win', 'loss', 'draw' from human perspective
        }),
        credentials: 'include', // Include cookies for session management
      });
      this.sessionId = null;
      return response;
    } catch (error) {
      console.error('Failed to end game:', error);
      this.sessionId = null;
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await this.request('/stats', {
        method: 'GET',
        credentials: 'include', // Include cookies for session management
      });
      return response;
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }

  async resetQTable() {
    try {
      const response = await this.request('/reset', {
        method: 'DELETE',
        credentials: 'include', // Include cookies for session management
      });
      return response;
    } catch (error) {
      console.error('Failed to reset Q-table:', error);
      throw error;
    }
  }

  clearSession() {
    this.sessionId = null;
  }

  hasActiveSession() {
    return this.sessionId !== null;
  }
}

export default new TicTacToeAPI();
