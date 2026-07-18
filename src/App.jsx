import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { X, Heart, Star, MessageCircle, User, Send, ArrowLeft, MapPin, Sparkles, SlidersHorizontal, Mail, Lock, LogIn } from "lucide-react";

// API_BASE : une fois le backend déployé, mets l'URL ici (ex: "https://ton-backend.up.railway.app")
// Laisse vide "" pour rester en mode démo (données locales, sans vrai serveur).
const API_BASE = "";

const INTENTIONS = [
  { value: "❤️ Relation sérieuse", emoji: "❤️", label: "Relation sérieuse" },
  { value: "💕 Rencontres sans prise de tête", emoji: "💕", label: "Sans prise de tête" },
  { value: "🍷 Prendre un verre", emoji: "🍷", label: "Prendre un verre" },
  { value: "🌙 Coup d'un soir", emoji: "🌙", label: "Coup d'un soir" },
  { value: "💬 Discuter et se faire des amis", emoji: "💬", label: "Discuter, amis" },
  { value: "✈️ Recherche de partenaire de voyage", emoji: "✈️", label: "Partenaire de voyage" },
];

const PROFILES = [
  { id: 1, name: "Aïcha", age: 24, city: "Douala", genre: "Femme", intention: INTENTIONS[0].value, bio: "Passionnée de danse et de bons plats. Toujours partante pour une nouvelle aventure.", tags: ["Danse", "Cuisine", "Voyages"], img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop" },
  { id: 2, name: "Yannis", age: 27, city: "Douala", genre: "Homme", intention: INTENTIONS[2].value, bio: "Entrepreneur le jour, guitariste la nuit. J'aime les longues discussions et le café noir.", tags: ["Musique", "Business", "Café"], img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop" },
  { id: 3, name: "Nina", age: 23, city: "Douala", genre: "Femme", intention: INTENTIONS[4].value, bio: "Étudiante en art, amoureuse des couchers de soleil et des vieux films.", tags: ["Art", "Cinéma", "Photo"], img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=800&fit=crop" },
  { id: 4, name: "Dina", age: 29, city: "Douala", genre: "Femme", intention: INTENTIONS[1].value, bio: "Sportive, drôle, et un peu trop compétitive au Ludo. Cherche quelqu'un qui suit le rythme.", tags: ["Fitness", "Humour", "Sport"], img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop" },
  { id: 5, name: "Malik", age: 26, city: "Douala", genre: "Homme", intention: INTENTIONS[5].value, bio: "Ingénieur le jour, chef amateur le soir. Toujours un nouveau plat à tester.", tags: ["Tech", "Cuisine", "Nature"], img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop" },
];

const CONVERSATIONS = [
  { id: 1, name: "Aïcha", img: PROFILES[0].img, lastMsg: "On se voit ce weekend ?", time: "14:20", unread: true,
    messages: [
      { from: "them", text: "Salut ! J'ai vu qu'on avait matché 😊" },
      { from: "me", text: "Salut Aïcha ! Oui, ton profil m'a tout de suite plu" },
      { from: "them", text: "Merci ! On se voit ce weekend ?" },
    ] },
  { id: 2, name: "Nina", img: PROFILES[2].img, lastMsg: "Haha trop drôle 😂", time: "hier", unread: false,
    messages: [
      { from: "me", text: "Tu regardes quoi comme films en ce moment ?" },
      { from: "them", text: "Surtout des vieux films français, et toi ?" },
      { from: "them", text: "Haha trop drôle 😂" },
    ] },
];

function SwipeCard({ profile, onSwipe, isTop, zIndex }) {
  const cardRef = useRef(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef({ x: 0, y: 0 });

  const handleDown = (clientX, clientY) => {
    if (!isTop) return;
    start.current = { x: clientX, y: clientY };
    setDrag((d) => ({ ...d, active: true }));
  };
  const handleMove = (clientX, clientY) => {
    if (!isTop || !drag.active) return;
    setDrag({ x: clientX - start.current.x, y: clientY - start.current.y, active: true });
  };
  const handleUp = () => {
    if (!isTop) return;
    if (drag.x > 120) onSwipe("like");
    else if (drag.x < -120) onSwipe("pass");
    else setDrag({ x: 0, y: 0, active: false });
    setDrag((d) => ({ ...d, active: false }));
  };

  const rotate = drag.x / 18;
  const likeOpacity = Math.min(Math.max(drag.x / 100, 0), 1);
  const passOpacity = Math.min(Math.max(-drag.x / 100, 0), 1);

  return (
    <div
      ref={cardRef}
      onMouseDown={(e) => handleDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleUp}
      onMouseLeave={() => isTop && drag.active && handleUp()}
      onTouchStart={(e) => handleDown(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleUp}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(20,8,28,0.45)",
        transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg)`,
        transition: drag.active ? "none" : "transform 0.35s cubic-bezier(.2,.8,.2,1)",
        cursor: isTop ? "grab" : "default",
        zIndex,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <img src={profile.img} alt={profile.name} draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(27,18,35,0.92) 0%, rgba(27,18,35,0.35) 45%, rgba(27,18,35,0) 65%)",
      }} />
      {profile.intention ? (
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "rgba(27,18,35,0.75)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 999, padding: "5px 14px", color: "#FBEFE9", fontSize: 12, fontWeight: 600,
          backdropFilter: "blur(4px)", whiteSpace: "nowrap",
        }}>{profile.intention}</div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 600, color: "#FBEFE9" }}>{profile.name}</span>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: "#E7D4E0" }}>{profile.age}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "#D8C4D0", fontSize: 13 }}>
          <MapPin size={13} /> {profile.city}
        </div>
        <p style={{ marginTop: 10, color: "#F0E3EC", fontSize: 14, lineHeight: 1.5, maxWidth: 320 }}>{profile.bio}</p>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {(profile.tags || []).map((t) => (
            <span key={t} style={{
              fontSize: 12, padding: "5px 11px", borderRadius: 999,
              background: "rgba(255,255,255,0.14)", color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.2)",
            }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{
        position: "absolute", top: 28, left: 24, padding: "6px 14px", borderRadius: 10,
        border: "3px solid #6BE0A8", color: "#6BE0A8", fontFamily: "Fraunces, serif", fontWeight: 700,
        fontSize: 22, letterSpacing: 1, transform: "rotate(-18deg)", opacity: likeOpacity,
      }}>LIKE</div>
      <div style={{
        position: "absolute", top: 28, right: 24, padding: "6px 14px", borderRadius: 10,
        border: "3px solid #FF6B5B", color: "#FF6B5B", fontFamily: "Fraunces, serif", fontWeight: 700,
        fontSize: 22, letterSpacing: 1, transform: "rotate(18deg)", opacity: passOpacity,
      }}>PASS</div>
    </div>
  );
}

const DEFAULT_FILTERS = { genre: "Tous", ageMin: 18, ageMax: 45, distance: 50, intention: "Toutes" };

function FiltersPanel({ filters, onChange, onClose }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(27,18,35,0.97)", zIndex: 40,
      padding: "20px 20px 0", display: "flex", flexDirection: "column", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: "#FBEFE9", fontWeight: 600 }}>Filtres</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#FBEFE9", cursor: "pointer" }}>
          <X size={22} />
        </button>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Je recherche</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {["Tous", "Homme", "Femme"].map((g) => (
            <button key={g} onClick={() => set("genre", g)} style={{
              flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer",
              background: filters.genre === g ? "#FF6B5B" : "rgba(255,255,255,0.08)",
              color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 13,
            }}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Type de rencontre</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <button onClick={() => set("intention", "Toutes")} style={{
            padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12.5,
            background: filters.intention === "Toutes" ? "#FF6B5B" : "rgba(255,255,255,0.08)",
            color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
          }}>Toutes</button>
          {INTENTIONS.map((it) => (
            <button key={it.value} onClick={() => set("intention", it.value)} style={{
              padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12.5,
              background: filters.intention === it.value ? "#FF6B5B" : "rgba(255,255,255,0.08)",
              color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
            }}>{it.emoji} {it.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Âge : {filters.ageMin} - {filters.ageMax} ans
        </label>
        <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
          <input type="range" min={18} max={60} value={filters.ageMin}
            onChange={(e) => set("ageMin", Math.min(Number(e.target.value), filters.ageMax))}
            style={{ flex: 1, accentColor: "#FF6B5B" }} />
          <input type="range" min={18} max={60} value={filters.ageMax}
            onChange={(e) => set("ageMax", Math.max(Number(e.target.value), filters.ageMin))}
            style={{ flex: 1, accentColor: "#FF6B5B" }} />
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Distance max : {filters.distance} km
        </label>
        <input type="range" min={1} max={100} value={filters.distance}
          onChange={(e) => set("distance", Number(e.target.value))}
          style={{ width: "100%", marginTop: 8, accentColor: "#FF6B5B" }} />
      </div>

      <button onClick={onClose} style={{
        marginTop: "auto", marginBottom: 24, padding: "13px 0", borderRadius: 14, cursor: "pointer",
        background: "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 15, fontWeight: 600,
      }}>Appliquer</button>
    </div>
  );
}

function DiscoverScreen({ onNewMatch }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [spark, setSpark] = useState(false);

  const loadProfiles = useCallback(async (f) => {
    setLoading(true);
    setLoadError("");
    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ genre: f.genre, ageMin: f.ageMin, ageMax: f.ageMax, intention: f.intention || "Toutes" });
        const res = await fetch(`${API_BASE}/api/discover?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Impossible de charger les profils.");
        setDeck(data.profiles || []);
      } catch (e) {
        setLoadError(e.message || "Connexion au serveur impossible.");
        setDeck([]);
      }
    } else {
      // Mode démo : pas de backend, on filtre les faux profils locaux.
      const next = PROFILES.filter((p) =>
        (f.genre === "Tous" || p.genre === f.genre) && p.age >= f.ageMin && p.age <= f.ageMax &&
        (!f.intention || f.intention === "Toutes" || p.intention === f.intention)
      );
      setDeck(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfiles(filters); }, [loadProfiles]);

  const applyFilters = (f) => {
    setFilters(f);
    setShowFilters(false);
    loadProfiles(f);
  };

  const swipe = useCallback(async (dir) => {
    const current = deck[0];
    if (!current) return;
    setDeck((d) => d.slice(1));

    if (dir === "like") {
      setSpark(true);
      setTimeout(() => setSpark(false), 550);
    }

    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/swipe`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ toUserId: current.id, action: dir === "like" ? "like" : "pass" }),
        });
        const data = await res.json();
        if (data.matched) onNewMatch(current);
      } catch {
        // Silencieux : en cas de coupure réseau, le swipe reste local pour ne pas bloquer l'utilisateur.
      }
    } else if (dir === "like" && Math.random() > 0.4) {
      // Mode démo : on simule un match aléatoire.
      onNewMatch(current);
    }
  }, [deck, onNewMatch]);

  return (
    <div style={{ padding: "18px 18px 0", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Heart size={18} color="#FF6B5B" fill="#FF6B5B" />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: "#FBEFE9" }}>Lovinia</span>
        </div>
        <button onClick={() => setShowFilters(true)} style={{
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: "#F2B84B", display: "flex", alignItems: "center", gap: 6,
        }}>
          <SlidersHorizontal size={15} />
          <span style={{ fontSize: 12 }}>Filtres</span>
        </button>
      </div>

      {showFilters && (
        <FiltersPanel filters={filters} onChange={applyFilters} onClose={() => setShowFilters(false)} />
      )}

      <div style={{ position: "relative", flex: 1, minHeight: 420 }}>
        {loading && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#B39FBF",
          }}>Chargement des profils...</div>
        )}
        {!loading && loadError && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", color: "#D8C4D0", textAlign: "center", gap: 8, padding: 20,
          }}>
            <p style={{ color: "#FF6B5B", fontSize: 13 }}>{loadError}</p>
          </div>
        )}
        {!loading && !loadError && deck.length === 0 && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", color: "#D8C4D0", textAlign: "center", gap: 8,
          }}>
            <Heart size={36} color="#FF6B5B" />
            <p style={{ fontFamily: "Fraunces, serif", fontSize: 19, color: "#FBEFE9" }}>Plus personne à découvrir</p>
            <p style={{ fontSize: 13, maxWidth: 220 }}>
              {API_BASE ? "Invite d'autres personnes à s'inscrire pour voir plus de profils." : "Reviens plus tard pour voir de nouveaux profils près de toi."}
            </p>
          </div>
        )}
        {!loading && deck.slice(0, 3).reverse().map((p, i) => (
          <SwipeCard
            key={p.id}
            profile={p}
            isTop={i === deck.slice(0, 3).length - 1}
            zIndex={i}
            onSwipe={swipe}
          />
        ))}
        {spark && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none", zIndex: 10,
          }}>
            <Heart size={90} color="#FF6B5B" fill="#FF6B5B" style={{ animation: "sparkPop 0.55s ease-out" }} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "18px 0 8px" }}>
        <button onClick={() => swipe("pass")} style={btnCircle("#2A1B33", "#FF6B5B", 58)}>
          <X size={26} />
        </button>
        <button onClick={() => swipe("like")} style={btnCircle("#FF6B5B", "#FBEFE9", 68)}>
          <Heart size={30} fill="#FBEFE9" />
        </button>
        <button onClick={() => swipe("like")} style={btnCircle("#2A1B33", "#F2B84B", 58)}>
          <Star size={24} fill="#F2B84B" />
        </button>
      </div>
    </div>
  );
}

function btnCircle(bg, fg, size) {
  return {
    width: size, height: size, borderRadius: "50%", background: bg, color: fg,
    border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 18px rgba(20,8,28,0.4)", cursor: "pointer",
  };
}

function MatchesScreen({ matches, onOpenChat }) {
  const [remoteMatches, setRemoteMatches] = useState(null);
  const [loading, setLoading] = useState(!!API_BASE);

  useEffect(() => {
    if (!API_BASE) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/matches`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setRemoteMatches((data.matches || []).map((m) => ({ ...m, matchId: m.match_id })));
      } catch {
        setRemoteMatches([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = API_BASE ? (remoteMatches || []) : matches;

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <span style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: "#FBEFE9" }}>Mes matchs</span>
      {loading ? (
        <p style={{ color: "#B39FBF", fontSize: 14, marginTop: 40, textAlign: "center" }}>Chargement...</p>
      ) : list.length === 0 ? (
        <p style={{ color: "#D8C4D0", fontSize: 14, marginTop: 40, textAlign: "center" }}>
          Aucun match pour l'instant. Continue à swiper !
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {list.map((m) => (
            <div key={m.id} onClick={() => onOpenChat(m)} style={{
              position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "3/4", cursor: "pointer",
            }}>
              <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,18,35,0.85), transparent 60%)",
              }} />
              <span style={{
                position: "absolute", bottom: 10, left: 12, color: "#FBEFE9",
                fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 600,
              }}>{m.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesScreen({ conversations, onOpenChat }) {
  const [remoteList, setRemoteList] = useState(null);
  const [loading, setLoading] = useState(!!API_BASE);

  useEffect(() => {
    if (!API_BASE) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/matches`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setRemoteList((data.matches || []).map((m) => ({
          id: m.id, matchId: m.match_id, name: m.name, img: m.img,
          lastMsg: "Dites bonjour !", time: "", unread: false,
        })));
      } catch {
        setRemoteList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = API_BASE ? (remoteList || []) : conversations;

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <span style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: "#FBEFE9" }}>Messages</span>
      <div style={{ marginTop: 12 }}>
        {loading && <p style={{ color: "#B39FBF", fontSize: 14, marginTop: 20, textAlign: "center" }}>Chargement...</p>}
        {!loading && list.length === 0 && (
          <p style={{ color: "#D8C4D0", fontSize: 14, marginTop: 40, textAlign: "center" }}>
            Aucune conversation pour l'instant. Matche avec quelqu'un pour commencer à discuter !
          </p>
        )}
        {list.map((c) => (
          <div key={c.id} onClick={() => onOpenChat(c)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 4px",
            borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
          }}>
            <img src={c.img} alt={c.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#FBEFE9", fontWeight: 600, fontSize: 15 }}>{c.name}</span>
                <span style={{ color: "#B39FBF", fontSize: 12 }}>{c.time}</span>
              </div>
              <p style={{
                color: c.unread ? "#FBEFE9" : "#B39FBF", fontSize: 13, margin: "2px 0 0",
                fontWeight: c.unread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{c.lastMsg}</p>
            </div>
            {c.unread && <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF6B5B" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatScreen({ conversation, currentUserId, onBack, onSend }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState(conversation.messages || []);
  const [loading, setLoading] = useState(!!API_BASE && !!conversation.matchId);

  useEffect(() => {
    if (!API_BASE || !conversation.matchId) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/matches/${conversation.matchId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversation.matchId]);

  const isMine = (m) => (API_BASE ? m.sender_id === currentUserId : m.from === "me");

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    if (API_BASE && conversation.matchId) {
      setMessages((m) => [...m, { sender_id: currentUserId, text: value, created_at: new Date().toISOString() }]);
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/api/matches/${conversation.matchId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: value }),
        });
      } catch {
        // Le message reste affiché localement même en cas de coupure réseau ponctuelle.
      }
    } else {
      onSend(value);
      setMessages((m) => [...m, { from: "me", text: value }]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#FBEFE9", cursor: "pointer", display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <img src={conversation.img} alt={conversation.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
        <span style={{ color: "#FBEFE9", fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600 }}>{conversation.name}</span>
      </div>
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {loading && <p style={{ color: "#B39FBF", fontSize: 13, textAlign: "center" }}>Chargement...</p>}
        {!loading && messages.length === 0 && (
          <p style={{ color: "#B39FBF", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            Dites bonjour pour lancer la conversation !
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: isMine(m) ? "flex-end" : "flex-start",
            background: isMine(m) ? "#FF6B5B" : "rgba(255,255,255,0.1)",
            color: "#FBEFE9", padding: "9px 14px", borderRadius: 16, maxWidth: "75%", fontSize: 14,
          }}>{m.text}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Écris un message..."
          style={{
            flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 20, padding: "10px 16px", color: "#FBEFE9", fontSize: 14, outline: "none",
          }}
        />
        <button onClick={send} style={btnCircle("#FF6B5B", "#FBEFE9", 40)}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function ProfileScreen({ user, onLogout }) {
  const [name, setName] = useState(user?.name || "Toi");
  const [bio, setBio] = useState("Ajoute une bio pour te présenter.");
  const [intention, setIntention] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!API_BASE) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.user) {
          setName(data.user.name || "");
          setBio(data.user.bio || "Ajoute une bio pour te présenter.");
          setIntention(data.user.intention || "");
        }
      } catch {
        // Silencieux : on garde les valeurs par défaut si le chargement échoue.
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/api/me`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, bio, intention }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        // Silencieux : l'utilisateur peut réessayer.
      }
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <span style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: "#FBEFE9" }}>Mon profil</span>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%", background: "#3A2645",
          display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #FF6B5B",
        }}>
          <User size={40} color="#F2B84B" />
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{
          background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)",
          color: "#FBEFE9", fontFamily: "Fraunces, serif", fontSize: 20, textAlign: "center",
          marginTop: 14, padding: "4px 0", outline: "none", width: 200,
        }} />
      </div>
      <div style={{ marginTop: 24 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} style={{
          width: "100%", marginTop: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 12, color: "#FBEFE9", fontSize: 14, padding: 12, outline: "none", resize: "none", boxSizing: "border-box",
        }} />
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Je recherche</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {INTENTIONS.map((it) => (
            <button key={it.value} onClick={() => setIntention(it.value)} style={{
              padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12.5,
              background: intention === it.value ? "#FF6B5B" : "rgba(255,255,255,0.08)",
              color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
            }}>{it.emoji} {it.label}</button>
          ))}
        </div>
      </div>

      {API_BASE && (
        <button onClick={save} disabled={saving} style={{
          marginTop: 20, width: "100%", padding: "12px 0", borderRadius: 14, cursor: saving ? "default" : "pointer",
          background: saved ? "#6BE0A8" : "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 14, fontWeight: 600,
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer les modifications"}
        </button>
      )}

      <div style={{ marginTop: 20, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16 }}>
        <p style={{ color: "#D8C4D0", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Version MVP — la vérification photo et les paramètres de confidentialité avancés arrivent dans une prochaine itération.
        </p>
      </div>

      <button onClick={onLogout} style={{
        marginTop: 16, width: "100%", padding: "12px 0", borderRadius: 14, cursor: "pointer",
        background: "rgba(255,255,255,0.06)", color: "#FF6B5B", border: "1px solid rgba(255,107,91,0.35)", fontSize: 14,
      }}>Se déconnecter</button>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("register"); // "register" | "login"
  const [form, setForm] = useState({ name: "", email: "", password: "", intention: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError("");
    if (!form.email || !form.password || (mode === "register" && !form.name)) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    if (mode === "register" && !form.intention) {
      setError("Choisis ce que tu recherches sur Lovinia pour continuer.");
      return;
    }
    setLoading(true);
    try {
      if (API_BASE) {
        // Connecté à un vrai backend (voir dating-app-backend/README.md)
        const res = await fetch(`${API_BASE}/api/auth/${mode === "register" ? "register" : "login"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
        localStorage.setItem("token", data.token);
        onAuth({ id: data.user.id, name: data.user.name, email: data.user.email });
      } else {
        // Mode démo : pas de serveur, on simule la connexion localement.
        await new Promise((r) => setTimeout(r, 400));
        onAuth({ id: "demo", name: form.name || form.email.split("@")[0], email: form.email });
      }
    } catch (e) {
      setError(e.message || "Connexion impossible. Vérifie le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "48px 26px 30px", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <Heart size={38} color="#FF6B5B" fill="#FF6B5B" />
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 32, color: "#FBEFE9", fontWeight: 700, margin: "10px 0 0", letterSpacing: 0.5 }}>
          Lovinia
        </p>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: "#F2B84B", fontWeight: 600, margin: "2px 0 8px" }}>
          {mode === "register" ? "Crée ton compte" : "Bon retour"}
        </p>
        <p style={{ color: "#B39FBF", fontSize: 13 }}>
          {mode === "register" ? "Rejoins la communauté en quelques secondes" : "Connecte-toi pour continuer"}
        </p>
      </div>

      {mode === "register" && (
        <div style={{ marginBottom: 12 }}>
          <div style={fieldWrap}>
            <User size={16} color="#8C7A94" />
            <input placeholder="Ton prénom" value={form.name} onChange={(e) => set("name", e.target.value)} style={fieldInput} />
          </div>
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <div style={fieldWrap}>
          <Mail size={16} color="#8C7A94" />
          <input placeholder="Adresse email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldInput} />
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={fieldWrap}>
          <Lock size={16} color="#8C7A94" />
          <input placeholder="Mot de passe" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} style={fieldInput} />
        </div>
      </div>

      {mode === "register" && (
        <div style={{ marginTop: 14, marginBottom: 4 }}>
          <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Tu recherches...
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {INTENTIONS.map((it) => (
              <button
                key={it.value}
                type="button"
                onClick={() => set("intention", it.value)}
                style={{
                  padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12.5,
                  background: form.intention === it.value ? "#FF6B5B" : "rgba(255,255,255,0.08)",
                  color: "#FBEFE9", border: form.intention === it.value ? "1px solid #FF6B5B" : "1px solid rgba(255,255,255,0.14)",
                }}
              >
                {it.emoji} {it.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{ color: "#FF6B5B", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}

      <button onClick={submit} disabled={loading} style={{
        marginTop: 18, padding: "13px 0", borderRadius: 14, cursor: loading ? "default" : "pointer",
        background: "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 15, fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1,
      }}>
        <LogIn size={16} />
        {loading ? "Connexion..." : mode === "register" ? "S'inscrire" : "Se connecter"}
      </button>

      <p style={{ textAlign: "center", color: "#B39FBF", fontSize: 13, marginTop: 18 }}>
        {mode === "register" ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
        <span onClick={() => setMode(mode === "register" ? "login" : "register")} style={{ color: "#F2B84B", cursor: "pointer" }}>
          {mode === "register" ? "Se connecter" : "S'inscrire"}
        </span>
      </p>
      {!API_BASE && (
        <p style={{ textAlign: "center", color: "#6B5A73", fontSize: 11, marginTop: 14 }}>
          Mode démo — connecte le backend pour une vraie authentification.
        </p>
      )}
    </div>
  );
}

const fieldWrap = {
  display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: "11px 14px",
};
const fieldInput = {
  background: "none", border: "none", outline: "none", color: "#FBEFE9", fontSize: 14, flex: 1,
};

export default function DatingAppMVP() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("discover");
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeChat, setActiveChat] = useState(null);
  const [matchToast, setMatchToast] = useState(null);

  const handleNewMatch = (profile) => {
    setMatches((m) => (m.find((x) => x.id === profile.id) ? m : [...m, profile]));
    setConversations((c) => (c.find((x) => x.id === profile.id) ? c : [
      ...c,
      { id: profile.id, name: profile.name, img: profile.img, lastMsg: "Vous avez matché !", time: "maintenant", unread: false, messages: [] },
    ]));
    setMatchToast(profile);
    setTimeout(() => setMatchToast(null), 2200);
  };

  const openChat = (conv) => {
    if (API_BASE) {
      setActiveChat(conv); // conv vient déjà du backend avec matchId, name, img
    } else {
      const full = conversations.find((c) => c.id === conv.id) || conv;
      setActiveChat(full);
    }
  };

  const sendMessage = (text) => {
    setConversations((cs) => cs.map((c) => c.id === activeChat.id
      ? { ...c, messages: [...c.messages, { from: "me", text }], lastMsg: text, time: "maintenant" }
      : c));
    setActiveChat((c) => ({ ...c, messages: [...c.messages, { from: "me", text }] }));
  };

  const tabs = [
    { id: "discover", icon: Sparkles, label: "Découvrir" },
    { id: "matches", icon: Heart, label: "Matchs" },
    { id: "messages", icon: MessageCircle, label: "Messages" },
    { id: "profile", icon: User, label: "Profil" },
  ];

  return (
    <div style={{
      width: "100%", maxWidth: 380, margin: "0 auto", height: 720, background: "#1B1223",
      borderRadius: 32, overflow: "hidden", position: "relative", fontFamily: "Inter, sans-serif",
      border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes sparkPop {
          0% { transform: scale(0.4); opacity: 0; }
          40% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #8C7A94; }
      `}</style>

      {!user ? (
        <AuthScreen onAuth={setUser} />
      ) : activeChat ? (
        <ChatScreen conversation={activeChat} currentUserId={user?.id} onBack={() => setActiveChat(null)} onSend={sendMessage} />
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {tab === "discover" && <DiscoverScreen onNewMatch={handleNewMatch} />}
            {tab === "matches" && <MatchesScreen matches={matches} onOpenChat={openChat} />}
            {tab === "messages" && <MessagesScreen conversations={conversations} onOpenChat={openChat} />}
            {tab === "profile" && <ProfileScreen user={user} onLogout={() => setUser(null)} />}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-around", padding: "10px 8px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)", background: "#1B1223",
          }}>
            {tabs.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                background: "none", border: "none", cursor: "pointer",
                color: tab === id ? "#FF6B5B" : "#8C7A94",
              }}>
                <Icon size={20} fill={tab === id && id === "discover" ? "#FF6B5B" : "none"} />
                <span style={{ fontSize: 10 }}>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {matchToast && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(27,18,35,0.92)", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 50, gap: 10,
        }}>
          <Heart size={54} color="#FF6B5B" fill="#FF6B5B" />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: "#FBEFE9", fontWeight: 700 }}>C'est un match !</span>
          <span style={{ color: "#D8C4D0", fontSize: 14 }}>Toi et {matchToast.name}, vous vous êtes likés</span>
        </div>
      )}
    </div>
  );
}
