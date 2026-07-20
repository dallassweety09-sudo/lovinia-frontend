import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { X, Heart, Star, MessageCircle, User, Send, ArrowLeft, MapPin, Sparkles, SlidersHorizontal, Mail, Lock, LogIn, BadgeCheck, Camera, Crown, Zap } from "lucide-react";

// API_BASE : une fois le backend déployé, mets l'URL ici (ex: "https://ton-backend.up.railway.app")
// Laisse vide "" pour rester en mode démo (données locales, sans vrai serveur).
const API_BASE = "https://dating-app-backend-production-2f11.up.railway.app";

// CLOUDINARY : pour l'upload réel de photos de profil depuis le téléphone.
// Remplis ces deux valeurs une fois ton compte Cloudinary créé (voir guide fourni).
const CLOUDINARY_CLOUD_NAME = "bodjxzrq";
const CLOUDINARY_UPLOAD_PRESET = "lovinia_photos";

// GOOGLE_CLIENT_ID : pour le bouton "Continuer avec Google".
// Remplis cette valeur une fois ton projet Google Cloud créé (voir guide fourni).
const GOOGLE_CLIENT_ID = "564982949909-m4prgodt5hovva2lm48087lt0e58q829.apps.googleusercontent.com"

async function uploadPhotoToCloudinary(file) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary n'est pas encore configuré.");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Échec de l'envoi de la photo.");
  return data.secure_url;
}

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
  const photos = (profile.photos && profile.photos.length) ? profile.photos : (profile.img ? [profile.img] : []);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => { setPhotoIndex(0); }, [profile.id]);

  const currentPhoto = photos[Math.min(photoIndex, photos.length - 1)] || profile.img;

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
    const isTap = Math.abs(drag.x) < 8 && Math.abs(drag.y) < 8;
    if (isTap && photos.length > 1) {
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        const tapX = start.current.x - rect.left;
        if (tapX < rect.width / 2) setPhotoIndex((i) => Math.max(0, i - 1));
        else setPhotoIndex((i) => Math.min(photos.length - 1, i + 1));
      }
      setDrag({ x: 0, y: 0, active: false });
      return;
    }
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
      <img src={currentPhoto} alt={profile.name} draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(27,18,35,0.92) 0%, rgba(27,18,35,0.35) 45%, rgba(27,18,35,0) 65%)",
      }} />
      {photos.length > 1 && (
        <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", gap: 4 }}>
          {photos.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i === photoIndex ? "#FBEFE9" : "rgba(255,255,255,0.35)",
            }} />
          ))}
        </div>
      )}
      {profile.intention ? (
        <div style={{
          position: "absolute", top: photos.length > 1 ? 24 : 16, left: "50%", transform: "translateX(-50%)",
          background: "rgba(27,18,35,0.75)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 999, padding: "5px 14px", color: "#FBEFE9", fontSize: 12, fontWeight: 600,
          backdropFilter: "blur(4px)", whiteSpace: "nowrap",
        }}>{profile.intention}</div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 600, color: "#FBEFE9" }}>{profile.name}</span>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: "#E7D4E0" }}>{profile.age}</span>
          {profile.verification_status === "verified" && <BadgeCheck size={20} color="#4FA8FF" fill="#1B1223" />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "#D8C4D0", fontSize: 13 }}>
          <MapPin size={13} /> {profile.city}{profile.profession ? ` · ${profile.profession}` : ""}
        </div>
        <p style={{ marginTop: 10, color: "#F0E3EC", fontSize: 14, lineHeight: 1.5, maxWidth: 320 }}>{profile.bio}</p>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {(profile.interests?.length ? profile.interests : profile.tags || []).map((t) => (
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
  const [limits, setLimits] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const loadLimits = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/me/limits`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLimits(data);
    } catch {
      // Silencieux : l'absence de compteur n'empêche pas de swiper.
    }
  }, []);

  useEffect(() => { loadLimits(); }, [loadLimits]);

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

    if (dir === "like" && API_BASE && limits && !limits.unlimited && limits.remaining <= 0) {
      setShowPaywall(true);
      return;
    }

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
        if (res.status === 403 && data.code === "LIKE_LIMIT_REACHED") {
          setShowPaywall(true);
          setLimits((l) => (l ? { ...l, remaining: 0 } : l));
          return;
        }
        if (data.matched) onNewMatch(current);
        if (dir === "like") setLimits((l) => (l && !l.unlimited ? { ...l, remaining: Math.max(0, l.remaining - 1), used: l.used + 1 } : l));
      } catch {
        // Silencieux : en cas de coupure réseau, le swipe reste local pour ne pas bloquer l'utilisateur.
      }
    } else if (dir === "like" && Math.random() > 0.4) {
      // Mode démo : on simule un match aléatoire.
      onNewMatch(current);
    }
  }, [deck, onNewMatch, limits]);

  return (
    <div style={{ padding: "18px 18px 0", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Lovinia" style={{ width: 24, height: 24, borderRadius: 6 }} />
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

      {limits && !limits.unlimited && (
        <div style={{ marginBottom: 10, color: "#8C7A94", fontSize: 11.5 }}>
          {limits.remaining} like{limits.remaining > 1 ? "s" : ""} restant{limits.remaining > 1 ? "s" : ""} aujourd'hui
        </div>
      )}

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

      {showPaywall && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(27,18,35,0.96)", zIndex: 60,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center",
        }}>
          <button onClick={() => setShowPaywall(false)} style={{
            position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#8C7A94", cursor: "pointer",
          }}><X size={20} /></button>

          <Crown size={40} color="#F2B84B" />
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: "#FBEFE9", fontWeight: 700, marginTop: 12 }}>
            Limite quotidienne atteinte
          </p>
          <p style={{ color: "#D8C4D0", fontSize: 13.5, marginTop: 8, maxWidth: 260 }}>
            Tu as utilisé tes {limits?.limit || ""} likes gratuits d'aujourd'hui. Passe Premium pour des likes illimités, à tout moment.
          </p>

          <div style={{ width: "100%", maxWidth: 280, marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { name: "Premium", price: "10 $ / 2 mois", detail: "Likes illimités", icon: Zap },
              { name: "VIP", price: "15 $ / 2 mois", detail: "+ Messages sans match, profil mis en avant", icon: Crown },
              { name: "Super VIP", price: "50 $ / 12 mois", detail: "Tous les avantages, priorité maximale", icon: Sparkles },
            ].map((plan) => (
              <div key={plan.name} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", textAlign: "left",
              }}>
                <plan.icon size={20} color="#F2B84B" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#FBEFE9", fontWeight: 600, fontSize: 13.5 }}>{plan.name}</span>
                    <span style={{ color: "#F2B84B", fontSize: 12.5 }}>{plan.price}</span>
                  </div>
                  <p style={{ color: "#B39FBF", fontSize: 11.5, marginTop: 2 }}>{plan.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: "#6B5A73", fontSize: 11, marginTop: 18 }}>
            Le paiement en ligne arrive bientôt — reviens vite !
          </p>
          <button onClick={() => setShowPaywall(false)} style={{
            marginTop: 10, padding: "10px 24px", borderRadius: 999, cursor: "pointer",
            background: "rgba(255,255,255,0.08)", color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 13,
          }}>Continuer en gratuit</button>
        </div>
      )}
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

function formatMessageTime(iso) {
  if (!iso) return "";
  const date = new Date(iso + "Z"); // SQLite CURRENT_TIMESTAMP is UTC without timezone marker
  const now = new Date();
  const diffMs = now - date;
  const diffMin = diffMs / 60000;
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `${Math.floor(diffMin)} min`;
  if (diffMin < 24 * 60) return `${Math.floor(diffMin / 60)} h`;
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: sameYear ? undefined : "2-digit" });
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
          lastMsg: m.last_message || "Dites bonjour !",
          time: formatMessageTime(m.last_message_at),
          unread: (m.unread_count || 0) > 0,
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

function ProfileScreen({ user, onLogout, onAccountDeleted }) {
  const [name, setName] = useState(user?.name || "Toi");
  const [bio, setBio] = useState("Ajoute une bio pour te présenter.");
  const [intention, setIntention] = useState("");
  const [photos, setPhotos] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState("none");
  const [verifUploading, setVerifUploading] = useState(false);
  const [verifError, setVerifError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const verifInputRef = useRef(null);

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
          setPhotos(data.user.photos || []);
          setVerificationStatus(data.user.verification_status || "none");
        }
      } catch {
        // Silencieux : on garde les valeurs par défaut si le chargement échoue.
      }
    })();
  }, []);

  const submitSelfie = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVerifError("");
    setVerifUploading(true);
    try {
      const url = await uploadPhotoToCloudinary(file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/verification/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ selfieUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.");
      setVerificationStatus("pending");
    } catch (err) {
      setVerifError(err.message || "Échec de l'envoi du selfie.");
    } finally {
      setVerifUploading(false);
      if (verifInputRef.current) verifInputRef.current.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/api/me`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, bio, intention, photos }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        // Silencieux : l'utilisateur peut réessayer.
      }
    }
    setSaving(false);
  };

  const deleteAccount = async () => {
    setDeleteError("");
    setDeleting(true);
    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/me`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ password: deletePassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Impossible de supprimer le compte.");
        localStorage.removeItem("token");
        onAccountDeleted();
      } catch (e) {
        setDeleteError(e.message || "Une erreur est survenue.");
        setDeleting(false);
        return;
      }
    } else {
      onAccountDeleted();
    }
    setDeleting(false);
  };

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <span style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: "#FBEFE9" }}>Mon profil</span>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%", background: "#3A2645", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #FF6B5B",
        }}>
          {photos[0] ? (
            <img src={photos[0]} alt="Photo de profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <User size={40} color="#F2B84B" />
          )}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{
          background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)",
          color: "#FBEFE9", fontFamily: "Fraunces, serif", fontSize: 20, textAlign: "center",
          marginTop: 14, padding: "4px 0", outline: "none", width: 200,
        }} />
        {verificationStatus === "verified" && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#4FA8FF", fontSize: 12.5, marginTop: 6 }}>
            <BadgeCheck size={15} /> Profil vérifié
          </span>
        )}
      </div>

      <div style={{ marginTop: 22, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BadgeCheck size={17} color={verificationStatus === "verified" ? "#4FA8FF" : "#8C7A94"} />
          <span style={{ color: "#FBEFE9", fontSize: 14, fontWeight: 600 }}>Badge de vérification</span>
        </div>

        {verificationStatus === "verified" && (
          <p style={{ color: "#4FA8FF", fontSize: 13, marginTop: 8 }}>Ton profil est vérifié ✓</p>
        )}
        {verificationStatus === "pending" && (
          <p style={{ color: "#F2B84B", fontSize: 13, marginTop: 8 }}>Ton selfie est en cours d'examen. On te tiendra au courant !</p>
        )}
        {(verificationStatus === "none" || verificationStatus === "rejected") && (
          <>
            {verificationStatus === "rejected" && (
              <p style={{ color: "#FF6B5B", fontSize: 12.5, marginTop: 8 }}>Ta précédente demande n'a pas été validée. Réessaie avec un selfie plus net.</p>
            )}
            <p style={{ color: "#D8C4D0", fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>
              Prends un selfie en direct pour demander le badge bleu et rassurer les autres membres.
            </p>
            <button
              type="button"
              onClick={() => verifInputRef.current?.click()}
              disabled={verifUploading || !API_BASE}
              style={{
                marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "11px 0", borderRadius: 12, cursor: verifUploading ? "default" : "pointer",
                background: "rgba(79,168,255,0.15)", color: "#4FA8FF", border: "1px solid rgba(79,168,255,0.4)",
                fontSize: 13.5, fontWeight: 600, opacity: verifUploading ? 0.7 : 1,
              }}
            >
              <Camera size={16} />
              {verifUploading ? "Envoi..." : "Prendre un selfie"}
            </button>
            <input
              ref={verifInputRef} type="file" accept="image/*" capture="user"
              onChange={submitSelfie} style={{ display: "none" }}
            />
            {!API_BASE && <p style={{ color: "#6B5A73", fontSize: 11, marginTop: 8 }}>Connecte le backend pour activer la vérification.</p>}
            {verifError && <p style={{ color: "#FF6B5B", fontSize: 12, marginTop: 8 }}>{verifError}</p>}
          </>
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Mes photos</label>
        <div style={{ marginTop: 8 }}>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
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
          L'ajout de photos est disponible dès maintenant. Le badge de vérification d'identité (selfie) et les paramètres de confidentialité avancés arrivent dans une prochaine itération.
        </p>
      </div>

      <button onClick={onLogout} style={{
        marginTop: 16, width: "100%", padding: "12px 0", borderRadius: 14, cursor: "pointer",
        background: "rgba(255,255,255,0.06)", color: "#FF6B5B", border: "1px solid rgba(255,107,91,0.35)", fontSize: 14,
      }}>Se déconnecter</button>

      {!confirmDelete ? (
        <button onClick={() => setConfirmDelete(true)} style={{
          marginTop: 10, marginBottom: 24, width: "100%", padding: "12px 0", borderRadius: 14, cursor: "pointer",
          background: "none", color: "#6B5A73", border: "none", fontSize: 13, textDecoration: "underline",
        }}>Supprimer mon compte</button>
      ) : (
        <div style={{ marginTop: 14, marginBottom: 24, background: "rgba(255,107,91,0.08)", border: "1px solid rgba(255,107,91,0.3)", borderRadius: 14, padding: 16 }}>
          <p style={{ color: "#FBEFE9", fontSize: 13.5, fontWeight: 600, margin: 0 }}>Supprimer définitivement ton compte ?</p>
          <p style={{ color: "#D8C4D0", fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>
            Cette action est irréversible : ton profil, tes matchs et tes messages seront effacés.
          </p>
          {API_BASE && (
            <div style={{ ...fieldWrap, marginTop: 10 }}>
              <Lock size={14} color="#8C7A94" />
              <input
                type="password" placeholder="Confirme ton mot de passe" value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)} style={fieldInput}
              />
            </div>
          )}
          {deleteError && <p style={{ color: "#FF6B5B", fontSize: 12, marginTop: 8 }}>{deleteError}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => { setConfirmDelete(false); setDeleteError(""); setDeletePassword(""); }} style={{
              flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer",
              background: "rgba(255,255,255,0.08)", color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 13,
            }}>Annuler</button>
            <button onClick={deleteAccount} disabled={deleting} style={{
              flex: 1, padding: "10px 0", borderRadius: 12, cursor: deleting ? "default" : "pointer",
              background: "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 13, fontWeight: 600, opacity: deleting ? 0.7 : 1,
            }}>{deleting ? "Suppression..." : "Confirmer"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const GENRES = ["Homme", "Femme"];
const GENRES_RECHERCHE = ["Homme", "Femme", "Tous"];
const REGISTER_STEPS = ["compte", "details", "interets", "intention", "photos"];
const GOOGLE_COMPLETION_STEPS = ["details", "interets", "intention", "photos"];

function TagInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ ...fieldInput, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: "10px 14px" }}
        />
        <button type="button" onClick={add} style={{
          padding: "0 16px", borderRadius: 12, background: "#FF6B5B", color: "#FBEFE9", border: "none", cursor: "pointer", fontSize: 13,
        }}>Ajouter</button>
      </div>
      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {values.map((v) => (
            <span key={v} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999,
              background: "rgba(255,255,255,0.1)", color: "#FBEFE9", fontSize: 12.5,
            }}>
              {v}
              <X size={12} style={{ cursor: "pointer" }} onClick={() => onChange(values.filter((x) => x !== v))} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoUploader({ photos, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [viewerUrl, setViewerUrl] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const url = await uploadPhotoToCloudinary(file);
      onChange([...photos, url]);
    } catch (err) {
      setUploadError(err.message || "Échec de l'envoi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addManualUrl = () => {
    if (manualUrl.trim()) {
      onChange([...photos, manualUrl.trim()]);
      setManualUrl("");
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {photos.map((url, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 12, overflow: "hidden" }}>
            <img
              src={url} alt={`Photo ${i + 1}`}
              onClick={() => setViewerUrl(url)}
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
            />
            {i === 0 && (
              <span style={{
                position: "absolute", bottom: 4, left: 4, background: "rgba(27,18,35,0.75)",
                color: "#F2B84B", fontSize: 9.5, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
              }}>Principale</span>
            )}
            <button type="button" onClick={() => onChange(photos.filter((_, idx) => idx !== i))} style={{
              position: "absolute", top: 4, right: 4, background: "rgba(27,18,35,0.8)", border: "none",
              borderRadius: "50%", width: 22, height: 22, color: "#FBEFE9", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}><X size={12} /></button>
          </div>
        ))}
        {photos.length < 6 && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={{
            aspectRatio: "3/4", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.04)", color: "#B39FBF", cursor: uploading ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
          }}>{uploading ? "..." : "+"}</button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      {!CLOUDINARY_CLOUD_NAME && (
        <div style={{ marginTop: 14 }}>
          <p style={{ color: "#6B5A73", fontSize: 11.5, marginBottom: 8 }}>
            Cloudinary n'est pas encore configuré — colle un lien d'image en attendant :
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://..."
              style={{ ...fieldInput, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: "10px 14px" }} />
            <button type="button" onClick={addManualUrl} style={{
              padding: "0 16px", borderRadius: 12, background: "#FF6B5B", color: "#FBEFE9", border: "none", cursor: "pointer", fontSize: 13,
            }}>+</button>
          </div>
        </div>
      )}
      {uploadError && <p style={{ color: "#FF6B5B", fontSize: 12, marginTop: 8 }}>{uploadError}</p>}
      <p style={{ color: "#8C7A94", fontSize: 11.5, marginTop: 10 }}>{photos.length}/2 photos minimum</p>

      {viewerUrl && (
        <div
          onClick={() => setViewerUrl(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,6,14,0.92)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20, cursor: "zoom-out",
          }}
        >
          <button onClick={() => setViewerUrl(null)} style={{
            position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.12)", border: "none",
            borderRadius: "50%", width: 36, height: 36, color: "#FBEFE9", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><X size={18} /></button>
          <img src={viewerUrl} alt="Photo agrandie" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

function GoogleSignInButton({ onGoogleAuth, disabled }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id || !divRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => onGoogleAuth(response.credential),
    });
    window.google.accounts.id.renderButton(divRef.current, {
      theme: "filled_black", size: "large", width: 280, text: "continue_with", shape: "pill",
    });
  }, [onGoogleAuth]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div style={{
        padding: "11px 0", borderRadius: 999, textAlign: "center", fontSize: 13,
        background: "rgba(255,255,255,0.05)", color: "#6B5A73", border: "1px solid rgba(255,255,255,0.1)",
      }}>Connexion Google bientôt disponible</div>
    );
  }

  return <div ref={divRef} style={{ display: "flex", justifyContent: "center", opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }} />;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("register"); // "register" | "login" | "complete-google"
  const [step, setStep] = useState(0);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    birthdate: "", genre: "", genre_recherche: "Tous", city: "", profession: "", taille: "",
    interests: [], langues: [], intention: "", photos: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = mode === "complete-google" ? GOOGLE_COMPLETION_STEPS : REGISTER_STEPS;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = () => {
    if (mode === "login") return true;
    const s = steps[step];
    if (s === "compte" && (!form.name || !form.email || !form.password)) return "Merci de remplir tous les champs.";
    if (s === "details" && (!form.birthdate || !form.genre || !form.city)) return "Merci de compléter tes informations.";
    if (s === "intention" && !form.intention) return "Choisis ce que tu recherches sur Lovinia.";
    if (s === "photos" && form.photos.length < 2) return "Ajoute au moins 2 photos pour continuer.";
    return null;
  };

  const goNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    if (step < steps.length - 1) setStep(step + 1);
    else if (mode === "complete-google") completeGoogleProfile();
    else submit();
  };

  const goBack = () => {
    setError("");
    if (step > 0) setStep(step - 1);
  };

  const submit = async () => {
    setLoading(true);
    try {
      if (API_BASE) {
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
        await new Promise((r) => setTimeout(r, 400));
        onAuth({ id: "demo", name: form.name || form.email.split("@")[0], email: form.email });
      }
    } catch (e) {
      setError(e.message || "Connexion impossible. Vérifie le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          birthdate: form.birthdate, genre: form.genre, genre_recherche: form.genre_recherche,
          city: form.city, profession: form.profession, taille: form.taille ? Number(form.taille) : null,
          interests: form.interests, langues: form.langues, intention: form.intention, photos: form.photos,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de finaliser ton profil.");
      onAuth(pendingGoogleUser);
    } catch (e) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = useCallback(async (credential) => {
    setError("");
    setLoading(true);
    try {
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Connexion Google impossible.");
        localStorage.setItem("token", data.token);
        const googleUser = { id: data.user.id, name: data.user.name, email: data.user.email };
        if (data.needsProfileCompletion) {
          setPendingGoogleUser(googleUser);
          setForm((f) => ({ ...f, name: data.user.name, email: data.user.email }));
          setMode("complete-google");
          setStep(0);
        } else {
          onAuth(googleUser);
        }
      } else {
        onAuth({ id: "demo", name: "Compte Google (démo)", email: "demo@gmail.com" });
      }
    } catch (e) {
      setError(e.message || "Connexion Google impossible.");
    } finally {
      setLoading(false);
    }
  }, [onAuth]);

  // Mode connexion : formulaire simple, une seule étape
  if (mode === "login") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "48px 26px 30px", justifyContent: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <img src="/logo.png" alt="Lovinia" style={{ width: 64, height: 64, borderRadius: 16 }} />
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 32, color: "#FBEFE9", fontWeight: 700, margin: "10px 0 0" }}>Lovinia</p>
          <p style={{ color: "#E89BB0", fontSize: 11.5, letterSpacing: 1.5, textTransform: "uppercase", margin: "2px 0 10px" }}>Connectez les cœurs</p>
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: "#F2B84B", fontWeight: 600, margin: "2px 0 8px" }}>Bon retour</p>
          <p style={{ color: "#B39FBF", fontSize: 13 }}>Connecte-toi pour continuer</p>
        </div>

        <GoogleSignInButton onGoogleAuth={handleGoogleAuth} disabled={loading} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ color: "#6B5A73", fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={fieldWrap}><Mail size={16} color="#8C7A94" /><input placeholder="Adresse email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldInput} /></div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={fieldWrap}><Lock size={16} color="#8C7A94" /><input placeholder="Mot de passe" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} style={fieldInput} /></div>
        </div>
        {error && <p style={{ color: "#FF6B5B", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
        <button onClick={submit} disabled={loading} style={{
          marginTop: 18, padding: "13px 0", borderRadius: 14, cursor: loading ? "default" : "pointer",
          background: "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 15, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1,
        }}><LogIn size={16} />{loading ? "Connexion..." : "Se connecter"}</button>
        <p style={{ textAlign: "center", color: "#B39FBF", fontSize: 13, marginTop: 18 }}>
          Pas encore de compte ? <span onClick={() => setMode("register")} style={{ color: "#F2B84B", cursor: "pointer" }}>S'inscrire</span>
        </p>
        {!API_BASE && <p style={{ textAlign: "center", color: "#6B5A73", fontSize: 11, marginTop: 14 }}>Mode démo — connecte le backend pour une vraie authentification.</p>}
      </div>
    );
  }

  // Mode inscription : parcours en plusieurs étapes
  const stepName = steps[step];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "28px 24px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <img src="/logo.png" alt="Lovinia" style={{ width: 48, height: 48, borderRadius: 12 }} />
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: "#FBEFE9", fontWeight: 700, margin: "8px 0 0" }}>Lovinia</p>
        <p style={{ color: "#E89BB0", fontSize: 10.5, letterSpacing: 1.3, textTransform: "uppercase", margin: "2px 0 0" }}>Connectez les cœurs</p>
        {mode === "complete-google" && (
          <p style={{ color: "#F2B84B", fontSize: 12.5, marginTop: 10 }}>Encore quelques infos pour finaliser ton profil</p>
        )}
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 18 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "#FF6B5B" : "rgba(255,255,255,0.12)" }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {stepName === "compte" && (
          <>
            <p style={{ color: "#F2B84B", fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Créons ton compte</p>

            <GoogleSignInButton onGoogleAuth={handleGoogleAuth} disabled={loading} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              <span style={{ color: "#6B5A73", fontSize: 12 }}>ou avec ton email</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            </div>

            <div style={{ marginBottom: 12 }}><div style={fieldWrap}><User size={16} color="#8C7A94" /><input placeholder="Ton prénom" value={form.name} onChange={(e) => set("name", e.target.value)} style={fieldInput} /></div></div>
            <div style={{ marginBottom: 12 }}><div style={fieldWrap}><Mail size={16} color="#8C7A94" /><input placeholder="Adresse email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldInput} /></div></div>
            <div style={{ marginBottom: 8 }}><div style={fieldWrap}><Lock size={16} color="#8C7A94" /><input placeholder="Mot de passe" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} style={fieldInput} /></div></div>
          </>
        )}

        {stepName === "details" && (
          <>
            <p style={{ color: "#F2B84B", fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Parle-nous de toi</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#B39FBF", fontSize: 12 }}>Date de naissance</label>
              <div style={{ ...fieldWrap, marginTop: 6 }}><input type="date" value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} style={{ ...fieldInput, colorScheme: "dark" }} /></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#B39FBF", fontSize: 12 }}>Tu es...</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {GENRES.map((g) => (
                  <button key={g} type="button" onClick={() => set("genre", g)} style={{
                    flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer",
                    background: form.genre === g ? "#FF6B5B" : "rgba(255,255,255,0.08)",
                    color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 13,
                  }}>{g}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#B39FBF", fontSize: 12 }}>Tu recherches un(e)...</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {GENRES_RECHERCHE.map((g) => (
                  <button key={g} type="button" onClick={() => set("genre_recherche", g)} style={{
                    flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer",
                    background: form.genre_recherche === g ? "#FF6B5B" : "rgba(255,255,255,0.08)",
                    color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 13,
                  }}>{g}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}><div style={fieldWrap}><MapPin size={16} color="#8C7A94" /><input placeholder="Ta ville" value={form.city} onChange={(e) => set("city", e.target.value)} style={fieldInput} /></div></div>
            <div style={{ marginBottom: 12 }}><div style={fieldWrap}><input placeholder="Profession (facultatif)" value={form.profession} onChange={(e) => set("profession", e.target.value)} style={fieldInput} /></div></div>
            <div style={{ marginBottom: 8 }}><div style={fieldWrap}><input placeholder="Taille en cm (facultatif)" type="number" value={form.taille} onChange={(e) => set("taille", e.target.value)} style={fieldInput} /></div></div>
          </>
        )}

        {stepName === "interets" && (
          <>
            <p style={{ color: "#F2B84B", fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Tes centres d'intérêt</p>
            <TagInput label="Centres d'intérêt" values={form.interests} onChange={(v) => set("interests", v)} placeholder="Ex: Musique, Voyage..." />
            <TagInput label="Langues parlées" values={form.langues} onChange={(v) => set("langues", v)} placeholder="Ex: Français, Anglais..." />
          </>
        )}

        {stepName === "intention" && (
          <>
            <p style={{ color: "#F2B84B", fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Tu recherches...</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INTENTIONS.map((it) => (
                <button key={it.value} type="button" onClick={() => set("intention", it.value)} style={{
                  padding: "9px 13px", borderRadius: 12, cursor: "pointer", fontSize: 13,
                  background: form.intention === it.value ? "#FF6B5B" : "rgba(255,255,255,0.08)",
                  color: "#FBEFE9", border: form.intention === it.value ? "1px solid #FF6B5B" : "1px solid rgba(255,255,255,0.14)",
                }}>{it.emoji} {it.label}</button>
              ))}
            </div>
          </>
        )}

        {stepName === "photos" && (
          <>
            <p style={{ color: "#F2B84B", fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Ajoute tes photos</p>
            <PhotoUploader photos={form.photos} onChange={(v) => set("photos", v)} />
          </>
        )}
      </div>

      {error && <p style={{ color: "#FF6B5B", fontSize: 12, margin: "10px 0 0" }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <button onClick={goBack} style={{
            flex: 1, padding: "13px 0", borderRadius: 14, cursor: "pointer",
            background: "rgba(255,255,255,0.08)", color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 14,
          }}>Retour</button>
        )}
        <button onClick={goNext} disabled={loading} style={{
          flex: 2, padding: "13px 0", borderRadius: 14, cursor: loading ? "default" : "pointer",
          background: "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 15, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1,
        }}>
          <LogIn size={16} />
          {loading ? "Enregistrement..." : step < steps.length - 1 ? "Suivant" : (mode === "complete-google" ? "Terminer" : "S'inscrire")}
        </button>
      </div>

      <p style={{ textAlign: "center", color: "#B39FBF", fontSize: 13, marginTop: 14 }}>
        Déjà un compte ? <span onClick={() => setMode("login")} style={{ color: "#F2B84B", cursor: "pointer" }}>Se connecter</span>
      </p>
      {!API_BASE && <p style={{ textAlign: "center", color: "#6B5A73", fontSize: 11, marginTop: 10 }}>Mode démo — connecte le backend pour une vraie authentification.</p>}
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

function AdminScreen() {
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (key) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/verifications`, { headers: { "x-admin-key": key } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Accès refusé.");
      setPending(data.pending || []);
      setUnlocked(true);
    } catch (e) {
      setError(e.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const decide = async (userId, approve) => {
    try {
      await fetch(`${API_BASE}/api/admin/verifications/${userId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ approve }),
      });
      setPending((p) => p.filter((u) => u.id !== userId));
    } catch {
      setError("Impossible d'enregistrer la décision. Réessaie.");
    }
  };

  if (!API_BASE) {
    return (
      <div style={{ padding: 40, color: "#FBEFE9", fontFamily: "Inter, sans-serif" }}>
        Connecte le backend (API_BASE) pour utiliser le tableau de bord admin.
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div style={{
        minHeight: "100vh", background: "#1B1223", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "Inter, sans-serif",
      }}>
        <div style={{ background: "#2A1B33", padding: 32, borderRadius: 16, width: 320 }}>
          <p style={{ color: "#FBEFE9", fontFamily: "Fraunces, serif", fontSize: 20, marginBottom: 16 }}>Accès administrateur</p>
          <input
            type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Clé admin"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.08)", color: "#FBEFE9", outline: "none", boxSizing: "border-box",
            }}
          />
          {error && <p style={{ color: "#FF6B5B", fontSize: 12.5, marginTop: 8 }}>{error}</p>}
          <button
            onClick={() => load(adminKey)} disabled={loading}
            style={{
              marginTop: 14, width: "100%", padding: "11px 0", borderRadius: 10, cursor: "pointer",
              background: "#FF6B5B", color: "#FBEFE9", border: "none", fontWeight: 600,
            }}
          >{loading ? "Vérification..." : "Entrer"}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#1B1223", padding: 24, fontFamily: "Inter, sans-serif" }}>
      <p style={{ color: "#FBEFE9", fontFamily: "Fraunces, serif", fontSize: 24, marginBottom: 20 }}>
        Vérifications en attente ({pending.length})
      </p>
      {pending.length === 0 && <p style={{ color: "#B39FBF" }}>Aucune demande en attente pour le moment.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {pending.map((u) => (
          <div key={u.id} style={{ background: "#2A1B33", borderRadius: 14, padding: 16 }}>
            <p style={{ color: "#FBEFE9", fontWeight: 600, marginBottom: 4 }}>{u.name} <span style={{ color: "#8C7A94", fontWeight: 400 }}>({u.email})</span></p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#B39FBF", fontSize: 11, marginBottom: 4 }}>Selfie soumis</p>
                <img src={u.verification_selfie} alt="Selfie" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8 }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#B39FBF", fontSize: 11, marginBottom: 4 }}>Photo de profil</p>
                <img src={u.photos?.[0] || u.img} alt="Profil" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => decide(u.id, false)} style={{
                flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
                background: "rgba(255,107,91,0.15)", color: "#FF6B5B", border: "1px solid rgba(255,107,91,0.35)", fontSize: 13,
              }}>Refuser</button>
              <button onClick={() => decide(u.id, true)} style={{
                flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
                background: "rgba(79,168,255,0.15)", color: "#4FA8FF", border: "1px solid rgba(79,168,255,0.4)", fontSize: 13,
              }}>Valider</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MainApp() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(!!API_BASE);
  const [tab, setTab] = useState("discover");
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeChat, setActiveChat] = useState(null);
  const [matchToast, setMatchToast] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!API_BASE) { setCheckingSession(false); return; }
    const token = localStorage.getItem("token");
    if (!token) { setCheckingSession(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("session invalide");
        const data = await res.json();
        setUser({ id: data.user.id, name: data.user.name, email: data.user.email });
      } catch {
        localStorage.removeItem("token");
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!API_BASE || !user) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/notifications/summary`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!cancelled) setUnreadMessages(data.unreadMessages || 0);
      } catch {
        // Silencieux : le badge reste juste sur son ancienne valeur en cas de coupure réseau.
      }
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, tab, activeChat]);

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

      {checkingSession ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Heart size={30} color="#FF6B5B" fill="#FF6B5B" style={{ opacity: 0.6 }} />
        </div>
      ) : !user ? (
        <AuthScreen onAuth={setUser} />
      ) : activeChat ? (
        <ChatScreen conversation={activeChat} currentUserId={user?.id} onBack={() => setActiveChat(null)} onSend={sendMessage} />
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {tab === "discover" && <DiscoverScreen onNewMatch={handleNewMatch} />}
            {tab === "matches" && <MatchesScreen matches={matches} onOpenChat={openChat} />}
            {tab === "messages" && <MessagesScreen conversations={conversations} onOpenChat={openChat} />}
            {tab === "profile" && <ProfileScreen user={user} onLogout={() => { localStorage.removeItem("token"); setUser(null); }} onAccountDeleted={() => { localStorage.removeItem("token"); setUser(null); }} />}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-around", padding: "10px 8px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)", background: "#1B1223",
          }}>
            {tabs.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                background: "none", border: "none", cursor: "pointer", position: "relative",
                color: tab === id ? "#FF6B5B" : "#8C7A94",
              }}>
                <div style={{ position: "relative" }}>
                  <Icon size={20} fill={tab === id && id === "discover" ? "#FF6B5B" : "none"} />
                  {id === "messages" && unreadMessages > 0 && (
                    <span style={{
                      position: "absolute", top: -5, right: -8, background: "#FF6B5B", color: "#FBEFE9",
                      fontSize: 9.5, fontWeight: 700, borderRadius: 999, minWidth: 15, height: 15,
                      display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                      border: "1.5px solid #1B1223",
                    }}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                  )}
                </div>
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

export default function DatingAppMVP() {
  const isAdminRoute = typeof window !== "undefined" && window.location.search.includes("admin=true");
  return isAdminRoute ? <AdminScreen /> : <MainApp />;
}
