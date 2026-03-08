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
    <div className="section-card section-music">
      <div className="flex items-center justify-between" style={{ animation: "fade-in 0.4s ease-out 0.25s forwards", opacity: 0 }}>
        <h2 className="text-[18px] font-semibold flex items-center gap-2" style={{ color: "hsl(var(--accent))" }}>
          <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
            <Music className="w-[18px] h-[18px] text-accent" />
          </div>
          Focus Music
        </h2>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-secondary/60 px-3 py-2 rounded-xl min-h-[44px]"
          >
            {station.label}
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-10 py-1 min-w-[160px]">
              {stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setStation(s); setOpen(false); setIsPlaying(true); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
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
          className="w-full py-8 sm:py-10 rounded-xl bg-secondary/40 border border-border/40 text-muted-foreground text-[15px] hover:text-foreground hover:bg-secondary/60 transition-all flex flex-col items-center gap-3 min-h-[44px]"
        >
          <Music className="w-6 h-6" />
          Click to start {station.label}
        </button>
      ) : (
        <div className="relative w-full rounded-xl overflow-hidden bg-secondary/40" style={{ aspectRatio: "16/9" }}>
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
