// Turns a pasted Spotify or YouTube link into the right official iframe
// embed URL. No OAuth, no developer app, no Premium requirement — works
// for anyone, since it's just the provider's own public embed player.
const SPOTIFY_TYPES = ["playlist", "album", "track", "artist", "show", "episode"];

export function parsePlayerUrl(raw) {
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "open.spotify.com") {
    const typePattern = SPOTIFY_TYPES.join("|");
    const match = url.pathname.match(new RegExp(`/(?:embed/)?(${typePattern})/([a-zA-Z0-9]+)`));
    if (!match) return null;
    const [, type, id] = match;
    return { provider: "spotify", embedUrl: `https://open.spotify.com/embed/${type}/${id}?theme=0` };
  }

  if (host === "youtu.be") {
    const videoId = url.pathname.slice(1);
    if (!videoId) return null;
    const listId = url.searchParams.get("list");
    return {
      provider: "youtube",
      embedUrl: listId
        ? `https://www.youtube.com/embed/${videoId}?list=${listId}`
        : `https://www.youtube.com/embed/${videoId}`,
    };
  }

  if (host === "youtube.com" || host === "music.youtube.com") {
    const videoId = url.searchParams.get("v");
    const listId = url.searchParams.get("list");
    const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);

    if (videoId && listId) {
      return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}?list=${listId}` };
    }
    if (videoId) {
      return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
    }
    if (listId) {
      return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/videoseries?list=${listId}` };
    }
    if (embedMatch) {
      return { provider: "youtube", embedUrl: url.href };
    }
    return null;
  }

  return null;
}
