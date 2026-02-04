import NextAuth, { type NextAuthOptions, type Session } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { spotifyApi } from "../../../server/spotify/client";

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../server/db/client";
import { JWT } from "next-auth/jwt";

const scopes = [
  "user-read-recently-played",
  "user-read-playback-state",
  "user-top-read",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-follow-read",
  "playlist-read-private",
  "user-read-email",
  "user-read-private",
  "user-library-read",
  "user-library-modify",
  "playlist-read-collaborative",
  "streaming",
].join(" ");

const params = {
  scope: scopes,
};

const queryParamString = new URLSearchParams(params);

async function refreshAccessToken(token: JWT) {
  try {
    spotifyApi.setAccessToken(token.accessToken as string);
    spotifyApi.setRefreshToken(token.refreshToken as string);
    const { body: refreshedToken } = await spotifyApi.refreshAccessToken();

    return {
      ...token,
      accessToken: refreshedToken.access_token,
      accessTokenExpires: Date.now() + refreshedToken.expires_in * 1000,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error(error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
      authorization: `https://accounts.spotify.com/authorize?${queryParamString.toString()}`,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at * 1000,
          refreshToken: account.refresh_token,
          user,
        };
      }
      // Return previous token if the access token has not expired yet
      const accessTokenExpires = Number(token.accessTokenExpires);
      if (!Number.isNaN(accessTokenExpires) && Date.now() < accessTokenExpires) {
        console.log("access token valid");
        return token;
      }

      // Access token has expired, try to update it
      console.log("access token expired");
      return refreshAccessToken(token);
    },
    async session({ session, token, user }) {
      const sessionWithTokens = session as Session & {
        accessToken?: string;
        refreshToken?: string;
        error?: string;
        user: { id?: string };
      };
      sessionWithTokens.accessToken = token.accessToken as string;
      sessionWithTokens.refreshToken = token.refreshToken as string;
      sessionWithTokens.error = token.error as string;
      sessionWithTokens.user.id = token.sub as string;

      return sessionWithTokens;
    },
  },
};

export default NextAuth(authOptions);
