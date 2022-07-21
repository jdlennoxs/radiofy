// import { createRouter } from "./context";
// import { z } from "zod";
// import SpotifyWebApi from "spotify-web-api-node";

// export const spotifyApi = new SpotifyWebApi({
//   clientId: process.env.SPOTIFY_CLIENT_ID || "",
//   clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
// });

// export const spotifyRouter = createRouter().query("getCurrentTrack", {
//   async resolve({ ctx }) {
//     // spotifyApi.setAccessToken(ctx.session.accessToken);
//     return await spotifyApi.getMyCurrentPlayingTrack();
//   },
// });

// .middleware(async ({ ctx, next }) => {
//   // Any queries or mutations after this middleware will
//   // raise an error unless there is a current session
//   console.log(ctx.session);
//   spotifyApi.setAccessToken(ctx.session.accessToken);
//   return next();
// })
