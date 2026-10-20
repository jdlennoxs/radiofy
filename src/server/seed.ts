import type { Track } from "../constants/schema";

/**
 * Curated SoundCloud library. Metadata captured from the public oEmbed
 * endpoint (no API key required). Playback is driven by the SoundCloud
 * Widget API against each track's permalink.
 *
 * Add tracks by appending { id, sourceId, name, artist, artwork }.
 */
export const SEED_TRACKS: Track[] = [
  {
    id: "forss-flickermood",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/forss/flickermood",
    name: "Flickermood",
    artist: "Forss",
    artwork: "https://i1.sndcdn.com/artworks-000067273316-smsiqx-t500x500.jpg",
  },
  {
    id: "bonobo-cirrus",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/bonobo/cirrus",
    name: "Cirrus",
    artist: "bonobo",
    artwork: "https://i1.sndcdn.com/artworks-DqT9F9J5HPuv-0-t500x500.jpg",
  },
  {
    id: "tycho-awake",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/tycho/awake",
    name: "Awake",
    artist: "Tycho",
    artwork: "https://i1.sndcdn.com/artworks-VEsr8icpGzsm-0-t500x500.jpg",
  },
  {
    id: "flume-holdin-on",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/flume/holdin-on",
    name: "Holdin On",
    artist: "Flume",
    artwork: "https://i1.sndcdn.com/artworks-8HNMjiwJQMYZ-0-t500x500.jpg",
  },
  {
    id: "tycho-division",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/tycho/division",
    name: "Division",
    artist: "Tycho",
    artwork: "https://i1.sndcdn.com/artworks-LhDbq8LYb8Wo-0-t500x500.jpg",
  },
  {
    id: "tycho-horizon",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/tycho/horizon",
    name: "Horizon",
    artist: "Tycho",
    artwork: "https://i1.sndcdn.com/artworks-Y4tuinpxxvZ9-0-t500x500.jpg",
  },
  {
    id: "bonobo-kerala",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/bonobo/kerala",
    name: "Kerala",
    artist: "bonobo",
    artwork: "https://i1.sndcdn.com/artworks-nd5do3eR82sw-0-t500x500.jpg",
  },
  {
    id: "forss-soulhack",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/forss/soulhack",
    name: "Soulhack",
    artist: "Forss",
    artwork: "https://i1.sndcdn.com/artworks-000067273301-we78rq-t500x500.jpg",
  },
  {
    id: "flume-never-be-like-you",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/flume/never-be-like-you",
    name: "Never Be Like You",
    artist: "Flume",
    artwork: "https://i1.sndcdn.com/artworks-pe6mw9Hbmbpq-0-t500x500.jpg",
  },
  {
    id: "flume-drop-the-game",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/flume/drop-the-game",
    name: "Drop the Game",
    artist: "Flume",
    artwork: "https://i1.sndcdn.com/artworks-MGTsHPR8GhmX-0-t500x500.jpg",
  },
  {
    id: "four-tet-two-thousand-and-seventeen",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/four-tet/two-thousand-and-seventeen",
    name: "Two Thousand And Seventeen",
    artist: "Four Tet",
    artwork: "https://i1.sndcdn.com/artworks-000231966885-ppwupc-t500x500.jpg",
  },
  {
    id: "odesza-bloom",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/odesza/bloom",
    name: "Bloom",
    artist: "ODESZA",
    artwork: "https://i1.sndcdn.com/artworks-2aNebv2SskI1-0-t500x500.jpg",
  },
  {
    id: "gramatik-dreams-about-her",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/gramatik/dreams-about-her",
    name: "Dreams About Her",
    artist: "Gramatik",
    artwork: "https://i1.sndcdn.com/artworks-ZhM5Y6fheJRH-0-t500x500.jpg",
  },
  {
    id: "ratatat-loud-pipes",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/ratatat/loud-pipes",
    name: "Loud Pipes",
    artist: "RATATAT",
    artwork: "https://i1.sndcdn.com/artworks-SQUsvnh9f3wH-0-t500x500.jpg",
  },
  {
    id: "kaskade-atmosphere",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/kaskade/atmosphere",
    name: "Atmosphere",
    artist: "Kaskade",
    artwork: "https://i1.sndcdn.com/artworks-hRnNdhtNfb5V-0-t500x500.jpg",
  },
  {
    id: "deadmau5-strobe",
    source: "soundcloud",
    sourceId: "https://soundcloud.com/deadmau5/strobe",
    name: "Strobe",
    artist: "deadmau5",
    artwork: "https://i1.sndcdn.com/artworks-zR3TUThcbpbz-0-t500x500.jpg",
  },
];
