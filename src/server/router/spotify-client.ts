const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

import { axiosInstance } from "axios";
export const spotifyClient = (accessToken) => {
  return axiosInstance.setup({
    baseUrl: SPOTIFY_API_BASE,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};
