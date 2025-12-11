import React, {useEffect, useState} from "react";

const PLAYLIST_ID = "PLM1XlwxBilobr6XVs-7H6O_mMXAiHZEcz";
// NOTE: Restricted API Key
const API_KEY = "AIzaSyCV7V2KZp-WUYnCWoGa85QY2ogJ5EkAaV0";

type Video = {
  index: number;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
};

type Props = {
  iframeId: string;
};

async function fetchPlaylist(): Promise<Video[]> {
  const baseUrl = "https://www.googleapis.com/youtube/v3/playlistItems";

  let pageToken: string | undefined = undefined;
  let videos: Video[] = [];
  let index = 1;

  // Playlist pagination (50 per page)
  for (; ;) {
    const url = new URL(baseUrl);
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", PLAYLIST_ID);
    url.searchParams.set("key", API_KEY);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`YouTube API error ${res.status}`);

    const json = await res.json();
    const items = json.items || [];

    const mapped = items.map((item: any) => {
      const s = item.snippet;
      const thumbs = s?.thumbnails ?? {};
      const thumb =
        thumbs.maxres ||
        thumbs.standard ||
        thumbs.high ||
        thumbs.medium ||
        thumbs.default;

      return {
        index: index++,
        videoId: item.contentDetails?.videoId ?? s?.resourceId?.videoId,
        title: s?.title ?? "",
        description: s?.description ?? "",
        thumbnailUrl: thumb?.url ?? "",
      };
    });

    videos = videos.concat(mapped);

    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return videos;
}

const TutorialPlaylistGrid: React.FC<Props> = ({iframeId}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;

    fetchPlaylist()
      .then((v) => live && setVideos(v))
      .catch((err) => {
        console.error(err);
        if (live) setError("Unable to load playlist.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false
    };
  }, []);

  function openVideo(
    event: React.MouseEvent<HTMLAnchorElement>,
    videoId: string,
    index: number
  ) {
    event.preventDefault();

    const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (!iframe) return;

    iframe.src = `https://www.youtube.com/embed/${videoId}?list=${PLAYLIST_ID}&index=${index}&autoplay=1`;
    iframe.scrollIntoView({behavior: "smooth", block: "center"});
  }

  if (loading) {
    return (
      <div className="section-body doc-tiles">
        <div className="doc-grid">
          <div className="doc-card">
            <div className="doc-card-title">Loading tutorials…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-body doc-tiles">
        <div className="doc-grid">
          <div className="doc-card">
            <div className="doc-card-title">Error loading playlist</div>
            <div className="doc-card-body">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-body doc-tiles">
      <div className="doc-grid">
        {videos.map((v, idx) => (
          <a
            key={v.videoId}
            className="doc-card"
            href={`https://www.youtube.com/watch?v=${v.videoId}`}
            onClick={(e) => openVideo(e, v.videoId, v.index)}
          >
            <div
              className="doc-card-title"
              style={{backgroundImage: `url('${v.thumbnailUrl}')`}}
            >
              {idx + 1}
            </div>
            <div className="doc-card-body">
              {v.title}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TutorialPlaylistGrid;
