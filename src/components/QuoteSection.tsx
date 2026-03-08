import { useState, useEffect } from "react";

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Stay foolish, stay hungry.", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Learning is not attained by chance, it must be sought for with ardor.", author: "Abigail Adams" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "Study hard, for the well is deep, and our brains are shallow.", author: "Richard Baxter" },
];

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
}

export default function QuoteSection() {
  const [quote, setQuote] = useState(getDailyQuote);

  useEffect(() => {
    setQuote(getDailyQuote());
  }, []);

  return (
    <div className="glass-card p-6 glow-amber text-center" style={{ animation: "fade-in 0.6s ease-out forwards" }}>
      <p className="text-lg md:text-xl font-light italic text-foreground/90 leading-relaxed">
        "{quote.text}"
      </p>
      <p className="mt-3 text-sm font-medium text-primary">— {quote.author}</p>
    </div>
  );
}
