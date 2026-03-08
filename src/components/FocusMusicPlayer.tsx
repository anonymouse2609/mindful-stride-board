import { useState } from "react";
import { Music, ChevronDown } from "lucide-react";

const stations = [
  { id: "lofi-girl", label: "Lo-fi Girl", videoId: "jfKfPfyJRdk" },
  { id: "chillhop", label: "Chillhop", videoId: "5yx6BWlEVcY" },
  { id: "jazz", label: "Jazz Vibes", videoId: "Dx5qFachd3A" },
  { id: "ambient", label: "Ambient Focus", videoId: "S_MOd40zlYU" },
  { id: "rain", label: "Rain Sounds", videoId: "mPZkdNFkNps" },
];

export default function FocusMusicPlayer() {
  const [station, setStation] = useState(stations[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-3" style={{ animation: "fade-in 0.4s ease-out 0.25s forwards", opacity: 0 }}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Music className="w-4 h-4 text-muted-foreground" />
          Focus Music
        </h2>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors bg-secondary/60 px-2 sm:px-2.5 py-1.5 rounded-lg"
          >
            {station.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
              {stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setStation(s); setOpen(false); setIsPlaying(true); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    s.id === station.id ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isPlaying ? (
        <button
          onClick={() => setIsPlaying(true)}
          className="w-full py-6 sm:py-8 rounded-lg bg-secondary/40 border border-border/40 text-muted-foreground text-xs hover:text-foreground hover:bg-secondary/60 transition-all flex flex-col items-center gap-2"
        >
          <Music className="w-5 h-5" />
          Click to start {station.label}
        </button>
      ) : (
        <div className="relative w-full rounded-lg overflow-hidden bg-secondary/40" style={{ aspectRatio: "16/9" }}>
          <iframe
            src={`https://www.youtube.com/embed/${station.videoId}?autoplay=1&loop=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title={station.label}
          />
        </div>
      )}
    </div>
  );
}
