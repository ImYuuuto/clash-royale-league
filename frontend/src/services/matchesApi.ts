import { axiosInstance } from './apiClient';
import type { GameRegistrationPayload, GameRegistrationResponse } from '../types/api';

export const matchesApi = {
  async registerGame(matchId: number, payload: GameRegistrationPayload): Promise<GameRegistrationResponse> {
    const response = await axiosInstance.post(`/api/matches/${matchId}/games`, payload);
    const body = response.data;
    return {
      success: body?.success ?? true,
      message: body?.message ?? 'Game registered successfully.',
      data: body?.data ?? body,
    };
  },

  async updateGame(matchId: number, gameId: number, payload: GameRegistrationPayload): Promise<GameRegistrationResponse> {
    const response = await axiosInstance.patch(`/api/matches/${matchId}/games/${gameId}`, payload);
    const body = response.data;
    return {
      success: body?.success ?? true,
      message: body?.message ?? 'Game updated successfully.',
      data: body?.data ?? body,
    };
  },
};
