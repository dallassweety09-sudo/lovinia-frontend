import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { X, Heart, Star, MessageCircle, User, Send, ArrowLeft, MapPin, Sparkles, SlidersHorizontal, Mail, Lock, LogIn, BadgeCheck, Camera, Crown, Zap, MoreVertical, Flag, ShieldOff, Eye, EyeOff, Plus, Trash2, Settings, Play, Grid, Gift, Coins, Wallet, ChevronRight, Video, Gem, Check } from "lucide-react";

// API_BASE : une fois le backend déployé, mets l'URL ici (ex: "https://ton-backend.up.railway.app")
// Laisse vide "" pour rester en mode démo (données locales, sans vrai serveur).
const API_BASE = "https://dating-app-backend-production-2f11.up.railway.app";

// CLOUDINARY : pour l'upload réel de photos de profil depuis le téléphone.
// Remplis ces deux valeurs une fois ton compte Cloudinary créé (voir guide fourni).
const CLOUDINARY_CLOUD_NAME = "bodjxzrq";
const CLOUDINARY_UPLOAD_PRESET = "lovinia_photos";

// GOOGLE_CLIENT_ID : pour le bouton "Continuer avec Google".
const GOOGLE_CLIENT_ID = "564982949909-m4prgodt5hovva2lm48087lt0e58q829.apps.googleusercontent.com";

// VAPID_PUBLIC_KEY : pour les notifications push. Doit correspondre à la clé publique
// générée côté backend (variable VAPID_PUBLIC_KEY sur Railway).
const VAPID_PUBLIC_KEY = "BEeHZ8XqHqavRyWlvWcRAJDnn5xKNppv_IjhsJ8jR3QmN_aWw4vtNAbU-OeOUR--O1Z2ocF5qb_LH_kuuQahlCw";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function enablePushNotifications() {
  if (!API_BASE || !VAPID_PUBLIC_KEY) throw new Error("Notifications non configurées.");
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Ton navigateur ne supporte pas les notifications push.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permission refusée.");

  const registration = await navigator.serviceWorker.register("/service-worker.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const token = localStorage.getItem("token");
  await fetch(`${API_BASE}/api/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ subscription }),
  });
  return true;
}

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

// Envoie une photo OU une vidéo vers Cloudinary (utilisé pour les publications du profil).
async function uploadMediaToCloudinary(file) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary n'est pas encore configuré.");
  }
  const isVideo = file.type?.startsWith("video/");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${isVideo ? "video" : "image"}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Échec de l'envoi du média.");
  return { url: data.secure_url, mediaType: isVideo ? "video" : "photo" };
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

const REPORT_REASONS = ["Faux profil", "Contenu inapproprié", "Harcèlement", "Arnaque / Spam", "Autre"];

function ReportBlockMenu({ targetId, targetName, onBlocked, iconColor = "#FBEFE9" }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu"); // "menu" | "report" | "block-confirm" | "done"
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => { setOpen(false); setView("menu"); setReason(""); setDetails(""); };

  const submitReport = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      if (API_BASE) {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/api/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reportedId: targetId, reason, details }),
        });
      }
      setView("done");
    } catch {
      setView("done");
    } finally {
      setBusy(false);
    }
  };

  const confirmBlock = async () => {
    setBusy(true);
    try {
      if (API_BASE) {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/api/block/${targetId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      close();
      onBlocked?.();
    } catch {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{ background: "rgba(27,18,35,0.4)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <MoreVertical size={16} color={iconColor} />
      </button>

      {open && (
        <div
          onClick={(e) => { e.stopPropagation(); close(); }}
          style={{ position: "fixed", inset: 0, background: "rgba(10,6,14,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#2A1B33", borderRadius: "20px 20px 0 0", padding: "20px 22px 28px", width: "100%", maxWidth: 400,
          }}>
            {view === "menu" && (
              <>
                <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 17, marginBottom: 14 }}>{targetName}</p>
                <button onClick={() => setView("report")} style={menuBtnStyle}>
                  <Flag size={16} /> Signaler ce profil
                </button>
                <button onClick={() => setView("block-confirm")} style={{ ...menuBtnStyle, color: "#FF6B5B" }}>
                  <ShieldOff size={16} /> Bloquer cette personne
                </button>
                <button onClick={close} style={{ ...menuBtnStyle, color: "#8C7A94", marginTop: 6 }}>Annuler</button>
              </>
            )}

            {view === "report" && (
              <>
                <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 17, marginBottom: 4 }}>Signaler {targetName}</p>
                <p style={{ color: "#B39FBF", fontSize: 12.5, marginBottom: 14 }}>Choisis le motif qui correspond le mieux :</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {REPORT_REASONS.map((r) => (
                    <button key={r} onClick={() => setReason(r)} style={{
                      padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12.5,
                      background: reason === r ? "#FF6B5B" : "rgba(255,255,255,0.08)",
                      color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
                    }}>{r}</button>
                  ))}
                </div>
                <textarea
                  value={details} onChange={(e) => setDetails(e.target.value)} rows={2}
                  placeholder="Précise si besoin (facultatif)"
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 12, color: "#FBEFE9", fontSize: 13, padding: 10, outline: "none", resize: "none", boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => setView("menu")} style={{ ...menuBtnStyle, flex: 1, justifyContent: "center" }}>Retour</button>
                  <button onClick={submitReport} disabled={!reason || busy} style={{
                    flex: 1, padding: "11px 0", borderRadius: 12, cursor: "pointer",
                    background: "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 13.5, fontWeight: 600, opacity: !reason || busy ? 0.6 : 1,
                  }}>{busy ? "Envoi..." : "Envoyer"}</button>
                </div>
              </>
            )}

            {view === "block-confirm" && (
              <>
                <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 17, marginBottom: 8 }}>Bloquer {targetName} ?</p>
                <p style={{ color: "#D8C4D0", fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 }}>
                  Cette personne ne pourra plus voir ton profil ni te contacter. Votre match et vos messages seront supprimés.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setView("menu")} style={{ ...menuBtnStyle, flex: 1, justifyContent: "center" }}>Annuler</button>
                  <button onClick={confirmBlock} disabled={busy} style={{
                    flex: 1, padding: "11px 0", borderRadius: 12, cursor: "pointer",
                    background: "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 13.5, fontWeight: 600, opacity: busy ? 0.6 : 1,
                  }}>{busy ? "..." : "Bloquer"}</button>
                </div>
              </>
            )}

            {view === "done" && (
              <>
                <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 17, marginBottom: 8 }}>Signalement envoyé</p>
                <p style={{ color: "#D8C4D0", fontSize: 12.5, marginBottom: 16 }}>Merci, notre équipe va l'examiner.</p>
                <button onClick={close} style={{
                  width: "100%", padding: "11px 0", borderRadius: 12, cursor: "pointer",
                  background: "rgba(255,255,255,0.08)", color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 13.5,
                }}>Fermer</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const menuBtnStyle = {
  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 4px", marginBottom: 2,
  background: "none", border: "none", color: "#FBEFE9", fontSize: 14, cursor: "pointer", textAlign: "left",
};

function SwipeCard({ profile, onSwipe, isTop, zIndex, onBlocked }) {
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
        borderRadius: 32,
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
      {isTop && (
        <div style={{ position: "absolute", top: photos.length > 1 ? 22 : 14, right: 14, zIndex: 5 }}>
          <ReportBlockMenu targetId={profile.id} targetName={profile.name} onBlocked={() => onBlocked?.(profile.id)} />
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 30, fontWeight: 600, color: "#FBEFE9" }}>{profile.name}</span>
          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, color: "#E7D4E0" }}>{profile.age}</span>
          {profile.verification_status === "verified" && <BadgeCheck size={20} color="#A78BFA" fill="#1B1223" />}
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
        border: "3px solid #6BE0A8", color: "#6BE0A8", fontFamily: "Manrope, sans-serif", fontWeight: 700,
        fontSize: 22, letterSpacing: 1, transform: "rotate(-18deg)", opacity: likeOpacity,
      }}>LIKE</div>
      <div style={{
        position: "absolute", top: 28, right: 24, padding: "6px 14px", borderRadius: 10,
        border: "3px solid #FF6B5B", color: "#FF6B5B", fontFamily: "Manrope, sans-serif", fontWeight: 700,
        fontSize: 22, letterSpacing: 1, transform: "rotate(18deg)", opacity: passOpacity,
      }}>PASS</div>
    </div>
  );
}

const DEFAULT_FILTERS = {
  genre: "Tous", ageMin: 18, ageMax: 45, distance: 50, intention: "Toutes",
  verifiedOnly: false, langue: "", tailleMin: "", tailleMax: "", commonInterests: false,
};

function FiltersPanel({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }));
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(27,18,35,0.97)", zIndex: 40,
      padding: "20px 20px 0", display: "flex", flexDirection: "column", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, color: "#FBEFE9", fontWeight: 600 }}>Filtres</span>
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
              background: draft.genre === g ? "#FF6B5B" : "rgba(255,255,255,0.08)",
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
            background: draft.intention === "Toutes" ? "#FF6B5B" : "rgba(255,255,255,0.08)",
            color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
          }}>Toutes</button>
          {INTENTIONS.map((it) => (
            <button key={it.value} onClick={() => set("intention", it.value)} style={{
              padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12.5,
              background: draft.intention === it.value ? "#FF6B5B" : "rgba(255,255,255,0.08)",
              color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
            }}>{it.emoji} {it.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Âge : {draft.ageMin} - {draft.ageMax} ans
        </label>
        <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
          <input type="range" min={18} max={60} value={draft.ageMin}
            onChange={(e) => set("ageMin", Math.min(Number(e.target.value), draft.ageMax))}
            style={{ flex: 1, accentColor: "#FF6B5B" }} />
          <input type="range" min={18} max={60} value={draft.ageMax}
            onChange={(e) => set("ageMax", Math.max(Number(e.target.value), draft.ageMin))}
            style={{ flex: 1, accentColor: "#FF6B5B" }} />
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Distance max : {draft.distance} km
        </label>
        <input type="range" min={1} max={100} value={draft.distance}
          onChange={(e) => set("distance", Number(e.target.value))}
          style={{ width: "100%", marginTop: 8, accentColor: "#FF6B5B" }} />
      </div>

      <div style={{ marginBottom: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Filtres avancés</label>

        <button onClick={() => set("verifiedOnly", !draft.verifiedOnly)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, cursor: "pointer",
          background: draft.verifiedOnly ? "rgba(79,168,255,0.15)" : "rgba(255,255,255,0.06)",
          border: draft.verifiedOnly ? "1px solid rgba(79,168,255,0.4)" : "1px solid rgba(255,255,255,0.12)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#FBEFE9", fontSize: 13.5 }}>
            <BadgeCheck size={16} color={draft.verifiedOnly ? "#A78BFA" : "#8C7A94"} /> Profils vérifiés uniquement
          </span>
          <div style={{ width: 34, height: 19, borderRadius: 999, background: draft.verifiedOnly ? "#A78BFA" : "rgba(255,255,255,0.2)", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#FBEFE9", position: "absolute", top: 2, left: draft.verifiedOnly ? 17 : 2, transition: "left 0.2s" }} />
          </div>
        </button>

        <button onClick={() => set("commonInterests", !draft.commonInterests)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, cursor: "pointer",
          background: draft.commonInterests ? "rgba(255,107,91,0.15)" : "rgba(255,255,255,0.06)",
          border: draft.commonInterests ? "1px solid rgba(255,107,91,0.4)" : "1px solid rgba(255,255,255,0.12)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#FBEFE9", fontSize: 13.5 }}>
            <Sparkles size={16} color={draft.commonInterests ? "#FF6B5B" : "#8C7A94"} /> Centres d'intérêt communs
          </span>
          <div style={{ width: 34, height: 19, borderRadius: 999, background: draft.commonInterests ? "#FF6B5B" : "rgba(255,255,255,0.2)", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#FBEFE9", position: "absolute", top: 2, left: draft.commonInterests ? 17 : 2, transition: "left 0.2s" }} />
          </div>
        </button>

        <div>
          <label style={{ color: "#8C7A94", fontSize: 11.5 }}>Langue parlée</label>
          <input
            value={draft.langue} onChange={(e) => set("langue", e.target.value)}
            placeholder="Ex: Français, Anglais..."
            style={{
              width: "100%", marginTop: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12, color: "#FBEFE9", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ color: "#8C7A94", fontSize: 11.5 }}>Taille (cm)</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              type="number" value={draft.tailleMin} onChange={(e) => set("tailleMin", e.target.value)}
              placeholder="Min" style={{
                flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12, color: "#FBEFE9", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box",
              }}
            />
            <input
              type="number" value={draft.tailleMax} onChange={(e) => set("tailleMax", e.target.value)}
              placeholder="Max" style={{
                flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12, color: "#FBEFE9", fontSize: 13, padding: "9px 12px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: "auto", marginBottom: 24 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: "13px 0", borderRadius: 14, cursor: "pointer",
          background: "rgba(255,255,255,0.08)", color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 14,
        }}>Annuler</button>
        <button onClick={() => onApply(draft)} style={{
          flex: 2, padding: "13px 0", borderRadius: 14, cursor: "pointer",
          background: "#FF6B5B", color: "#FBEFE9", border: "none", fontSize: 15, fontWeight: 600,
        }}>Enregistrer</button>
      </div>
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
  const [coins, setCoins] = useState(null);
  const [lastSwiped, setLastSwiped] = useState(null);
  const [toast, setToast] = useState("");

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

  const loadCoins = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/me/coins`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return; // Erreur passagère : on garde le solde précédemment affiché.
      const data = await res.json();
      if (typeof data.coins === "number") setCoins(data.coins);
    } catch {
      // Silencieux : on garde le solde précédemment affiché plutôt que de l'effacer.
    }
  }, []);

  useEffect(() => {
    loadLimits();
    loadCoins();
    // Réessaie régulièrement : si le tout premier chargement échoue (réseau, erreur passagère...),
    // le solde finit quand même par s'afficher au lieu de rester vide pour toute la session.
    const interval = setInterval(loadCoins, 30000);
    return () => clearInterval(interval);
  }, [loadLimits, loadCoins]);

  // Demande la position GPS une fois, pour calculer de vraies distances (silencieux si refusé).
  useEffect(() => {
    if (!API_BASE || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${API_BASE}/api/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          });
        } catch {
          // Silencieux.
        }
      },
      () => {}, // refus de géolocalisation : on continue sans distance réelle
      { timeout: 8000 }
    );
  }, []);

  const loadProfiles = useCallback(async (f) => {
    setLoading(true);
    setLoadError("");
    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({
          genre: f.genre, ageMin: f.ageMin, ageMax: f.ageMax, intention: f.intention || "Toutes",
          verifiedOnly: f.verifiedOnly ? "true" : "false",
          langue: f.langue || "",
          tailleMin: f.tailleMin || "",
          tailleMax: f.tailleMax || "",
          commonInterests: f.commonInterests ? "true" : "false",
          maxDistance: f.distance || "",
        });
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const swipe = useCallback(async (dir) => {
    const current = deck[0];
    if (!current) return;

    const isLikeAction = dir === "like" || dir === "superlike";
    if (isLikeAction && API_BASE && limits && !limits.unlimited && limits.remaining <= 0) {
      setShowPaywall(true);
      return;
    }
    if (dir === "superlike" && API_BASE && coins != null && coins < 10) {
      showToast("Pas assez de Lovinia Coins pour un Super Like (10 requis).");
      return;
    }

    setDeck((d) => d.slice(1));
    setLastSwiped({ profile: current, action: dir });

    if (isLikeAction) {
      setSpark(true);
      setTimeout(() => setSpark(false), 550);
    }

    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/swipe`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ toUserId: current.id, action: dir }),
        });
        const data = await res.json();
        if (res.status === 403 && data.code === "LIKE_LIMIT_REACHED") {
          setShowPaywall(true);
          setLimits((l) => (l ? { ...l, remaining: 0 } : l));
          return;
        }
        if (res.status === 402 && data.code === "INSUFFICIENT_COINS") {
          showToast("Pas assez de Lovinia Coins pour un Super Like.");
          return;
        }
        if (res.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
          showToast("Confirme ton email (voir Mon profil) avant de pouvoir liker des profils.");
          return;
        }
        if (data.matched) onNewMatch(current);
        if (isLikeAction) setLimits((l) => (l && !l.unlimited ? { ...l, remaining: Math.max(0, l.remaining - 1), used: l.used + 1 } : l));
        if (dir === "superlike") setCoins((c) => (c == null ? c : Math.max(0, c - 10)));
      } catch {
        // Silencieux : en cas de coupure réseau, le swipe reste local pour ne pas bloquer l'utilisateur.
      }
    } else if (dir === "like" && Math.random() > 0.4) {
      // Mode démo : on simule un match aléatoire.
      onNewMatch(current);
    }
  }, [deck, onNewMatch, limits, coins]);

  const undoSwipe = useCallback(async () => {
    if (!lastSwiped) return;
    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/swipe/undo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setDeck((d) => [data.restored || lastSwiped.profile, ...d]);
      } catch {
        setDeck((d) => [lastSwiped.profile, ...d]);
      }
    } else {
      setDeck((d) => [lastSwiped.profile, ...d]);
    }
    setLastSwiped(null);
  }, [lastSwiped]);

  return (
    <div style={{ padding: "18px 18px 0", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Lovinia" style={{ width: 24, height: 24, borderRadius: 6 }} />
          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, fontWeight: 700, color: "#FBEFE9" }}>Lovinia</span>
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
        <FiltersPanel filters={filters} onApply={applyFilters} onClose={() => setShowFilters(false)} />
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
            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: 19, color: "#FBEFE9" }}>Plus personne à découvrir</p>
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
            onBlocked={(id) => setDeck((d) => d.filter((x) => x.id !== id))}
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
        <button onClick={() => swipe("like")} style={{
          ...btnCircle("transparent", "#2A0E12", 68),
          background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)",
          boxShadow: "0 14px 26px -8px rgba(232,84,138,0.55)",
        }}>
          <Heart size={30} fill="#2A0E12" />
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
          <p style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, color: "#FBEFE9", fontWeight: 700, marginTop: 12 }}>
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

function MatchesScreen({ matches, onOpenChat, onViewProfile }) {
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
      <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 24, fontWeight: 600, color: "#FBEFE9" }}>Mes matchs</span>
      {loading ? (
        <p style={{ color: "#B39FBF", fontSize: 14, marginTop: 40, textAlign: "center" }}>Chargement...</p>
      ) : list.length === 0 ? (
        <p style={{ color: "#D8C4D0", fontSize: 14, marginTop: 40, textAlign: "center" }}>
          Aucun match pour l'instant. Continue à swiper !
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {list.map((m) => (
            <div key={m.id} onClick={() => onViewProfile(m)} style={{
              position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "3/4", cursor: "pointer",
            }}>
              <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,18,35,0.85), transparent 60%)",
              }} />
              {m.last_active_at && getPresence(m.last_active_at).online && (
                <span style={{ position: "absolute", top: 10, right: 10, width: 11, height: 11, borderRadius: "50%", background: "#3ECF6B", border: "2px solid #1B1223" }} />
              )}
              <span style={{
                position: "absolute", bottom: 10, left: 12, color: "#FBEFE9",
                fontFamily: "Manrope, sans-serif", fontSize: 16, fontWeight: 600,
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

// Statut de présence "En ligne" / "Vu il y a..." à partir de la dernière activité connue (last_active_at).
function getPresence(iso) {
  if (!iso) return { online: false, label: "" };
  const date = new Date(iso + "Z");
  const now = new Date();
  const diffMin = (now - date) / 60000;
  if (diffMin < 2) return { online: true, label: "En ligne" };
  if (diffMin < 60) return { online: false, label: `Vu il y a ${Math.max(1, Math.floor(diffMin))} min` };
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return { online: false, label: `Vu il y a ${Math.floor(diffMin / 60)} h` };
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return { online: false, label: `Vu hier à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` };
  }
  if (diffMin < 7 * 24 * 60) {
    return { online: false, label: `Vu ${date.toLocaleDateString("fr-FR", { weekday: "long" })}` };
  }
  return { online: false, label: `Vu le ${date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}` };
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
          id: m.id, matchId: m.match_id, name: m.name, img: m.img, last_active_at: m.last_active_at,
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
      <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 24, fontWeight: 800, color: "#FBEFE9" }}>Messages</span>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {loading && <p style={{ color: "#B39FBF", fontSize: 14, marginTop: 20, textAlign: "center" }}>Chargement...</p>}
        {!loading && list.length === 0 && (
          <p style={{ color: "#D8C4D0", fontSize: 14, marginTop: 40, textAlign: "center" }}>
            Aucune conversation pour l'instant. Matche avec quelqu'un pour commencer à discuter !
          </p>
        )}
        {list.map((c) => (
          <div key={c.id} onClick={() => onOpenChat(c)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            borderRadius: 20, cursor: "pointer",
            background: c.unread ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.025)",
            border: `1px solid ${c.unread ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
            backdropFilter: "blur(16px)",
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={c.img} alt={c.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
              {c.last_active_at && getPresence(c.last_active_at).online && (
                <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: "#3ECF6B", border: "2px solid #1B1223" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#FBEFE9", fontWeight: 700, fontSize: 14.5, fontFamily: "Manrope, sans-serif" }}>{c.name}</span>
                <span style={{ color: "#8B7A93", fontSize: 11.5 }}>{c.time}</span>
              </div>
              <p style={{
                color: c.unread ? "#F0E3EC" : "#8B7A93", fontSize: 13, margin: "2px 0 0",
                fontWeight: c.unread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{c.lastMsg}</p>
            </div>
            {c.unread && <div style={{ width: 9, height: 9, borderRadius: "50%", background: "linear-gradient(120deg, #FF6B5B, #9B5DE5)", flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileDetailScreen({ match, currentUserId, onBack, onMessage }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!API_BASE && !!match.matchId);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!API_BASE || !match.matchId) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/matches/${match.matchId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Profil introuvable.");
        setProfile(data.profile);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [match.matchId]);

  // En mode démo (sans backend), on affiche directement les infos déjà connues du match.
  const p = profile || match;
  const photos = (p.photos && p.photos.length) ? p.photos : (p.img ? [p.img] : []);
  const currentPhoto = photos[Math.min(photoIndex, Math.max(photos.length - 1, 0))] || p.img;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", flexShrink: 0 }}>
        <img src={currentPhoto} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,18,35,0.92) 0%, rgba(27,18,35,0.1) 55%, rgba(27,18,35,0) 70%)",
        }} />
        {photos.length > 1 && (
          <>
            <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", gap: 4 }}>
              {photos.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === photoIndex ? "#FBEFE9" : "rgba(255,255,255,0.35)" }} />
              ))}
            </div>
            <button onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "40%", background: "none", border: "none", cursor: "pointer" }} />
            <button onClick={() => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "40%", background: "none", border: "none", cursor: "pointer" }} />
          </>
        )}
        <button onClick={onBack} style={{
          position: "absolute", top: 16, left: 14, background: "rgba(27,18,35,0.55)", border: "none",
          borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ArrowLeft size={18} color="#FBEFE9" />
        </button>
        <div style={{ position: "absolute", top: 16, right: 14 }}>
          <ReportBlockMenu targetId={p.id} targetName={p.name} onBlocked={onBack} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 30, fontWeight: 600, color: "#FBEFE9" }}>{p.name}</span>
            {p.age ? <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, color: "#E7D4E0" }}>{p.age}</span> : null}
            {p.verification_status === "verified" && <BadgeCheck size={20} color="#A78BFA" fill="#1B1223" />}
          </div>
          {(p.city || p.profession) && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "#D8C4D0", fontSize: 13 }}>
              <MapPin size={13} /> {p.city}{p.profession ? ` · ${p.profession}` : ""}
            </div>
          )}
          {p.last_active_at && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
              {getPresence(p.last_active_at).online && (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3ECF6B" }} />
              )}
              <span style={{ color: getPresence(p.last_active_at).online ? "#3ECF6B" : "#B39FBF", fontSize: 12.5, fontWeight: 600 }}>
                {getPresence(p.last_active_at).label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "18px 20px 28px" }}>
        {loading && <p style={{ color: "#B39FBF", fontSize: 13.5, textAlign: "center" }}>Chargement du profil...</p>}

        {p.intention && (
          <div style={{
            display: "inline-block", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 999, padding: "6px 14px", color: "#FBEFE9", fontSize: 12.5, fontWeight: 600, marginBottom: 14,
          }}>{p.intention}</div>
        )}

        {p.bio && (
          <p style={{ color: "#F0E3EC", fontSize: 14.5, lineHeight: 1.6, marginBottom: 16 }}>{p.bio}</p>
        )}

        {p.taille ? (
          <p style={{ color: "#B39FBF", fontSize: 13, marginBottom: 12 }}>Taille : {p.taille} cm</p>
        ) : null}

        {(p.interests?.length ? p.interests : p.tags || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#8C7A94", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Centres d'intérêt</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(p.interests?.length ? p.interests : p.tags || []).map((t) => (
                <span key={t} style={{
                  fontSize: 12.5, padding: "6px 12px", borderRadius: 999,
                  background: "rgba(255,255,255,0.08)", color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
                }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {p.langues?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#8C7A94", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Langues parlées</p>
            <p style={{ color: "#D8C4D0", fontSize: 13.5 }}>{p.langues.join(", ")}</p>
          </div>
        )}

        <UserPostsSection userId={p.id} currentUserId={currentUserId} />

        <button onClick={onMessage} style={{
          width: "100%", padding: "14px 0", borderRadius: 999, cursor: "pointer",
          background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)", color: "#2A0E12", border: "none", fontSize: 15, fontWeight: 800, fontFamily: "Manrope, sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <MessageCircle size={18} /> Envoyer un message
        </button>
      </div>
    </div>
  );
}

function ChatScreen({ conversation, currentUserId, onBack, onSend, onViewProfile }) {
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

    // On revérifie régulièrement si l'autre personne a lu nos messages
    // (passage discret de "Envoyé" à "Vu"), et s'il y a de nouveaux messages.
    const poll = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/matches/${conversation.matchId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch {
        // Silencieux : on retentera au prochain intervalle.
      }
    }, 4000);
    return () => clearInterval(poll);
  }, [conversation.matchId]);

  const isMine = (m) => (API_BASE ? m.sender_id === currentUserId : m.from === "me");

  const [sendError, setSendError] = useState("");

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    setSendError("");
    if (API_BASE && conversation.matchId) {
      const tempId = `temp-${Date.now()}`;
      setMessages((m) => [...m, { tempId, sender_id: currentUserId, text: value, created_at: new Date().toISOString() }]);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/matches/${conversation.matchId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: value }),
        });
        const data = await res.json();
        if (!res.ok) {
          // Message refusé par le serveur (ex: coordonnées personnelles bloquées) : on le retire de l'affichage
          // et on redonne le texte à l'utilisateur pour qu'il puisse le modifier.
          setMessages((m) => m.filter((x) => x.tempId !== tempId));
          setSendError(data.error || "Message non envoyé.");
          setText(value);
        }
      } catch {
        // Coupure réseau ponctuelle : on laisse le message affiché localement.
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
        <button
          onClick={() => onViewProfile?.(conversation)}
          style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
        >
          <div style={{ position: "relative" }}>
            <img src={conversation.img} alt={conversation.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            {getPresence(conversation.last_active_at).online && (
              <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#3ECF6B", border: "2px solid #1B1223" }} />
            )}
          </div>
          <div>
            <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, margin: 0 }}>{conversation.name}</p>
            {conversation.last_active_at && (
              <p style={{ color: getPresence(conversation.last_active_at).online ? "#3ECF6B" : "#8C7A94", fontSize: 11, margin: 0 }}>
                {getPresence(conversation.last_active_at).label}
              </p>
            )}
          </div>
        </button>
        <ReportBlockMenu targetId={conversation.id} targetName={conversation.name} iconColor="#8C7A94" onBlocked={onBack} />
      </div>
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {loading && <p style={{ color: "#B39FBF", fontSize: 13, textAlign: "center" }}>Chargement...</p>}
        {!loading && messages.length === 0 && (
          <p style={{ color: "#B39FBF", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            Dites bonjour pour lancer la conversation !
          </p>
        )}
        {messages.map((m, i) => {
          const mine = isMine(m);
          const isLastMine = mine && !messages.slice(i + 1).some(isMine);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
              <div style={{
                background: mine ? "linear-gradient(120deg, #FF6B5B 0%, #E8548A 60%, #9B5DE5 100%)" : "rgba(255,255,255,0.08)",
                border: mine ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: mine ? "#2A0E12" : "#F0E3EC", fontWeight: mine ? 600 : 400,
                padding: "10px 15px", borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "75%", fontSize: 14,
              }}>{m.text}</div>
              {isLastMine && API_BASE && (
                <span style={{ color: "#8C7A94", fontSize: 10.5, marginTop: 3, marginRight: 2 }}>
                  {m.is_read ? "Vu" : "Envoyé"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {sendError && (
        <div style={{ margin: "0 16px 8px", padding: "10px 12px", background: "rgba(255,107,91,0.12)", border: "1px solid rgba(255,107,91,0.35)", borderRadius: 12 }}>
          <p style={{ color: "#FF9B8E", fontSize: 12, margin: 0, lineHeight: 1.4 }}>🔒 {sendError}</p>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Écris un message..."
          style={{
            flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 999, padding: "11px 18px", color: "#FBEFE9", fontSize: 14, outline: "none",
          }}
        />
        <button onClick={send} style={{
          ...btnCircle("transparent", "#2A0E12", 42),
          background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)",
        }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function VisitorsModal({ onClose }) {
  const [visitors, setVisitors] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_BASE) { setLoading(false); return; }
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/visitors`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setVisitors(data.visitors || []);
      } catch {
        setVisitors([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,6,14,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#2A1B33", borderRadius: "20px 20px 0 0", padding: "20px 22px 28px", width: "100%", maxWidth: 400, maxHeight: "75vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 18, fontWeight: 600, margin: 0 }}>Qui a visité mon profil</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8C7A94", cursor: "pointer" }}><X size={20} /></button>
        </div>

        {!API_BASE && <p style={{ color: "#6B5A73", fontSize: 12.5 }}>Connecte le backend pour voir tes visiteurs.</p>}
        {API_BASE && loading && <p style={{ color: "#B39FBF", fontSize: 13 }}>Chargement...</p>}
        {API_BASE && !loading && visitors?.length === 0 && (
          <p style={{ color: "#B39FBF", fontSize: 13 }}>Personne n'a encore visité ton profil.</p>
        )}
        {visitors?.map((v) => (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <img src={v.img} alt={v.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: "#FBEFE9", fontSize: 14, fontWeight: 600, margin: 0 }}>{v.name}, {v.age}</p>
              <p style={{ color: "#8C7A94", fontSize: 11.5, margin: 0 }}>{formatMessageTime(v.visited_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GiftPickerModal({ postId, onClose, onSent }) {
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(!!API_BASE);
  const [sendingId, setSendingId] = useState(null);
  const [error, setError] = useState("");
  const [coins, setCoins] = useState(null);

  const load = async () => {
    if (!API_BASE) {
      setGifts([{ id: 1, name: "Rose", icon: "🌹", price_coins: 20 }, { id: 2, name: "Cœur", icon: "❤️", price_coins: 50 }, { id: 3, name: "Diamant", icon: "💎", price_coins: 150 }, { id: 4, name: "Couronne", icon: "👑", price_coins: 300 }]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [gRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/api/gifts/catalog`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/me/coins`, { headers: authHeaders() }),
      ]);
      if (!gRes.ok) throw new Error("Impossible de charger la boutique pour le moment. Réessaie dans un instant.");
      const gData = await gRes.json();
      setGifts(gData.gifts || []);
      if (cRes.ok) {
        const cData = await cRes.json();
        if (typeof cData.coins === "number") setCoins(cData.coins);
      }
    } catch (e) {
      setError(e.message || "Impossible de charger la boutique pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sendGift = async (gift) => {
    setError("");
    setSendingId(gift.id);
    if (!API_BASE) {
      onSent(gift);
      onClose();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ giftId: gift.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'envoyer ce cadeau.");
      onSent(gift);
      onClose();
    } catch (e) {
      setError(e.message || "Erreur d'envoi.");
      setSendingId(null);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,6,14,0.9)", zIndex: 320, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#2A1B33", borderRadius: "20px 20px 0 0", padding: "20px 20px 30px", width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 18, fontWeight: 600, margin: 0 }}>Envoyer un cadeau</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8C7A94", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {coins != null && (
          <p style={{ color: "#B39FBF", fontSize: 12, marginBottom: 14, display: "flex", alignItems: "center", gap: 5 }}>
            <Coins size={13} color="#F2B84B" /> Solde : {coins} Coins
          </p>
        )}
        {loading && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Chargement...</p>}
        {error && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ color: "#FF6B5B", fontSize: 12, marginBottom: 6 }}>{error}</p>
            <button onClick={load} style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#FBEFE9",
              borderRadius: 10, padding: "6px 14px", fontSize: 12, cursor: "pointer",
            }}>Réessayer</button>
          </div>
        )}
        {!loading && gifts.length === 0 && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Aucun cadeau disponible pour l'instant.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 6 }}>
          {gifts.map((g) => (
            <button key={g.id} onClick={() => sendGift(g)} disabled={sendingId === g.id} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 4px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
              cursor: sendingId === g.id ? "default" : "pointer", opacity: sendingId === g.id ? 0.6 : 1,
            }}>
              <span style={{ fontSize: 28 }}>{g.icon}</span>
              <span style={{ color: "#FBEFE9", fontSize: 11 }}>{g.name}</span>
              <span style={{ color: "#F2B84B", fontSize: 10.5, display: "flex", alignItems: "center", gap: 2 }}>
                <Coins size={10} /> {g.price_coins}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostDetailModal({ post, isOwner, currentUserId, onClose, onDeleted, onUpdated }) {
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(!!API_BASE);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(post.comments_enabled !== 0);
  const [commentsPermission, setCommentsPermission] = useState(post.comments_permission || "everyone");
  const [giftTotal, setGiftTotal] = useState(0);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [giftBurst, setGiftBurst] = useState(null); // icône affichée brièvement à l'envoi
  const [viewCount, setViewCount] = useState(post.viewCount || 0);
  const [showViewers, setShowViewers] = useState(false);

  useEffect(() => {
    if (!API_BASE) return;
    // Enregistre une vue une seule fois par personne (le propriétaire ne compte pas ses propres vues).
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/${post.id}/view`, { method: "POST", headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.viewCount === "number") setViewCount(data.viewCount);
      } catch {
        // Silencieux : le compteur de vues n'est pas critique.
      }
    })();
  }, [post.id]);

  useEffect(() => {
    if (!API_BASE) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/${post.id}/gifts`, { headers: authHeaders() });
        if (!res.ok) return; // Erreur passagère : on garde le compteur initial plutôt que de l'effacer.
        const data = await res.json();
        if (typeof data.total === "number") setGiftTotal(data.total);
      } catch {
        // Silencieux : on garde le compteur initial.
      }
    })();
  }, [post.id]);

  const handleGiftSent = (gift) => {
    setGiftTotal((c) => c + 1);
    setGiftBurst(gift.icon);
    setTimeout(() => setGiftBurst(null), 1600);
  };

  useEffect(() => {
    if (!API_BASE) { setLoadingComments(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, { headers: authHeaders() });
        const data = await res.json();
        setComments(data.comments || []);
      } catch {
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    })();
  }, [post.id]);

  const toggleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/like`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
    } catch {
      // Silencieux : l'état local reste correct même en cas de coupure ponctuelle.
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentError("");
    if (!API_BASE) {
      setComments((c) => [...c, { id: Date.now(), text, name: "Toi", user_id: currentUserId }]);
      setCommentText("");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'envoyer le commentaire.");
      setComments((c) => [...c, data.comment]);
      setCommentText("");
    } catch (e) {
      setCommentError(e.message || "Erreur d'envoi.");
    }
  };

  const deleteComment = async (commentId) => {
    setComments((c) => c.filter((x) => x.id !== commentId));
    if (!API_BASE) return;
    try {
      await fetch(`${API_BASE}/api/posts/${post.id}/comments/${commentId}`, { method: "DELETE", headers: authHeaders() });
    } catch {
      // Silencieux.
    }
  };

  const deletePost = async () => {
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/posts/${post.id}`, { method: "DELETE", headers: authHeaders() });
      } catch {
        // Silencieux.
      }
    }
    onDeleted?.(post.id);
    onClose();
  };

  const saveSettings = async (nextEnabled, nextPermission) => {
    setCommentsEnabled(nextEnabled);
    setCommentsPermission(nextPermission);
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/posts/${post.id}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ commentsEnabled: nextEnabled, commentsPermission: nextPermission }),
        });
      } catch {
        // Silencieux.
      }
    }
    onUpdated?.(post.id, { comments_enabled: nextEnabled ? 1 : 0, comments_permission: nextPermission });
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(10,6,14,0.9)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 14,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#1B1223", borderRadius: 20, width: "100%", maxWidth: 420, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#000", flexShrink: 0 }}>
          {post.media_type === "video" ? (
            <video src={post.media_url} controls playsInline preload="metadata" poster={getVideoThumbnail(post.media_url)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <img src={post.media_url} alt="Publication" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          )}
          {giftBurst && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontSize: 64, animation: "giftFloat 1.6s ease-out forwards" }}>{giftBurst}</span>
              <style>{`@keyframes giftFloat { 0% { transform: translateY(20px) scale(0.5); opacity: 0; } 30% { transform: translateY(-10px) scale(1.2); opacity: 1; } 100% { transform: translateY(-90px) scale(1); opacity: 0; } }`}</style>
            </div>
          )}
          <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color="#FBEFE9" />
          </button>
          {isOwner && (
            <button onClick={() => setShowSettings((s) => !s)} style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Settings size={15} color="#FBEFE9" />
            </button>
          )}
        </div>

        {showSettings && isOwner && (
          <div style={{ padding: 14, background: "#2A1B33", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#FBEFE9", fontSize: 13 }}>Autoriser les commentaires</span>
              <button onClick={() => saveSettings(!commentsEnabled, commentsPermission)} style={{
                width: 36, height: 20, borderRadius: 999, border: "none", cursor: "pointer",
                background: commentsEnabled ? "#F2B84B" : "rgba(255,255,255,0.2)", position: "relative",
              }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#1B1223", position: "absolute", top: 2.5, left: commentsEnabled ? 19 : 2, transition: "left 0.2s" }} />
              </button>
            </div>
            {commentsEnabled && (
              <div style={{ display: "flex", gap: 6 }}>
                {[{ v: "everyone", l: "Tout le monde" }, { v: "matches", l: "Mes matchs seulement" }].map((opt) => (
                  <button key={opt.v} onClick={() => saveSettings(commentsEnabled, opt.v)} style={{
                    flex: 1, padding: "7px 0", borderRadius: 10, fontSize: 11.5, cursor: "pointer",
                    background: commentsPermission === opt.v ? "#FF6B5B" : "rgba(255,255,255,0.08)",
                    color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
                  }}>{opt.l}</button>
                ))}
              </div>
            )}
            <button onClick={deletePost} style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, color: "#FF6B5B", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, padding: 0 }}>
              <Trash2 size={14} /> Supprimer cette publication
            </button>
          </div>
        )}

        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={toggleLike} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Heart size={20} color={liked ? "#FF6B5B" : "#B39FBF"} fill={liked ? "#FF6B5B" : "none"} />
            <span style={{ color: "#FBEFE9", fontSize: 13 }}>{likeCount}</span>
          </button>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#B39FBF", fontSize: 13 }}>
            <MessageCircle size={18} /> {comments.length}
          </span>
          {isOwner ? (
            <button onClick={() => setShowViewers(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, color: "#B39FBF", fontSize: 13 }}>
              <Eye size={17} /> {viewCount}
            </button>
          ) : (
            viewCount > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#B39FBF", fontSize: 13 }}>
                <Eye size={17} /> {viewCount}
              </span>
            )
          )}
          {giftTotal > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#B39FBF", fontSize: 13 }}>
              <Gift size={17} /> {giftTotal}
            </span>
          )}
          {!isOwner && post.owner_verified && (
            <button onClick={() => setShowGiftPicker(true)} style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "rgba(242,184,75,0.15)",
              border: "1px solid rgba(242,184,75,0.4)", borderRadius: 999, padding: "6px 12px", color: "#F2B84B", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}>
              <Gift size={14} /> Cadeau
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
          {loadingComments && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Chargement des commentaires...</p>}
          {!loadingComments && comments.length === 0 && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Aucun commentaire pour l'instant.</p>}
          {comments.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
              <img src={c.img} alt={c.name} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: "#3A2645" }} />
              <p style={{ flex: 1, color: "#FBEFE9", fontSize: 12.5, lineHeight: 1.4 }}>
                <b>{c.name}</b> <span style={{ color: "#D8C4D0", fontWeight: 400 }}>{c.text}</span>
              </p>
              {(c.user_id === currentUserId || isOwner) && (
                <button onClick={() => deleteComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B5A73", padding: 0 }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {!commentsEnabled ? (
            <p style={{ color: "#8C7A94", fontSize: 12 }}>Les commentaires sont désactivés sur cette publication.</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
                  placeholder="Ajouter un commentaire..."
                  style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 20, padding: "9px 14px", color: "#FBEFE9", fontSize: 13, outline: "none" }}
                />
                <button onClick={submitComment} style={btnCircle("#FF6B5B", "#FBEFE9", 36)}><Send size={14} /></button>
              </div>
              {commentError && <p style={{ color: "#FF6B5B", fontSize: 11.5, marginTop: 6 }}>{commentError}</p>}
            </>
          )}
        </div>
      </div>
      {showGiftPicker && (
        <GiftPickerModal postId={post.id} onClose={() => setShowGiftPicker(false)} onSent={handleGiftSent} />
      )}
      {showViewers && (
        <PostViewersModal postId={post.id} onClose={() => setShowViewers(false)} />
      )}
    </div>
  );
}

function PostViewersModal({ postId, onClose }) {
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(!!API_BASE);
  const [error, setError] = useState("");

  const load = async () => {
    if (!API_BASE) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/posts/${postId}/views`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setViewers(data.viewers || []);
    } catch {
      setError("Impossible de charger la liste pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,6,14,0.9)", zIndex: 330, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1B1223", borderRadius: 20, width: "100%", maxWidth: 400, maxHeight: "75vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={18} /> Qui a vu ({viewers.length})
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8C7A94", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px" }}>
          {error && (
            <div>
              <p style={{ color: "#FF6B5B", fontSize: 12, marginBottom: 8 }}>{error}</p>
              <button onClick={load} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#FBEFE9", borderRadius: 10, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Réessayer</button>
            </div>
          )}
          {!error && loading && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Chargement...</p>}
          {!error && !loading && viewers.length === 0 && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Personne n'a encore vu cette publication.</p>}
          {viewers.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <img src={v.img} alt={v.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", background: "#3A2645" }} />
              <div style={{ flex: 1 }}>
                <p style={{ color: "#FBEFE9", fontSize: 13, margin: 0 }}>{v.name}</p>
              </div>
              <span style={{ color: "#6B5A73", fontSize: 11 }}>{formatMessageTime(v.viewed_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Cloudinary génère automatiquement une image fixe (frame) d'une vidéo si on change son extension en .jpg.
// Beaucoup plus fiable qu'un <video> pour afficher une vignette (Safari iOS n'affiche pas toujours
// la première image d'une balise <video> sans interaction de l'utilisateur).
function getVideoThumbnail(videoUrl) {
  if (!videoUrl) return videoUrl;
  return videoUrl.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, ".jpg$1");
}

function PostsGrid({ posts, isOwner, currentUserId, onOpen }) {
  if (posts.length === 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
      {posts.map((p) => (
        <div key={p.id} onClick={() => onOpen(p)} style={{ position: "relative", aspectRatio: "1/1", borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "#2A1B33" }}>
          {p.media_type === "video" ? (
            <img src={getVideoThumbnail(p.media_url)} alt="Publication vidéo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <img src={p.media_url} alt="Publication" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {isOwner && p.moderation_status && p.moderation_status !== "approved" && (
            <div style={{
              position: "absolute", top: 6, left: 6, padding: "3px 7px", borderRadius: 999, fontSize: 9.5, fontWeight: 600,
              background: p.moderation_status === "rejected" ? "rgba(255,107,91,0.85)" : "rgba(242,184,75,0.85)", color: "#1B1223",
            }}>
              {p.moderation_status === "rejected" ? "Refusée" : "En attente"}
            </div>
          )}
          {p.media_type === "video" && (
            <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={11} color="#FBEFE9" fill="#FBEFE9" />
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", padding: "12px 6px 5px", display: "flex", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#FBEFE9", fontSize: 10.5 }}>
              <Heart size={10} fill={p.likedByMe ? "#FF6B5B" : "none"} color={p.likedByMe ? "#FF6B5B" : "#FBEFE9"} /> {p.likeCount}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#FBEFE9", fontSize: 10.5 }}>
              <MessageCircle size={10} /> {p.commentCount}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Section "Mes publications" affichée dans l'écran Profil du propriétaire du compte.
function MyPostsSection({ currentUserId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(!!API_BASE);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [openPost, setOpenPost] = useState(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const load = async () => {
    if (!API_BASE) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/api/posts/mine`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Lit la durée d'un fichier vidéo côté navigateur, avant même de l'envoyer vers Cloudinary.
  const getVideoDuration = (file) =>
    new Promise((resolve, reject) => {
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(videoEl.src);
        resolve(videoEl.duration);
      };
      videoEl.onerror = () => reject(new Error("Impossible de lire cette vidéo."));
      videoEl.src = URL.createObjectURL(file);
    });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.type.startsWith("video/")) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > 10.5) {
          setError(`Cette vidéo dure ${Math.round(duration)} secondes. Les vidéos sont limitées à 10 secondes maximum.`);
          if (photoInputRef.current) photoInputRef.current.value = "";
          if (videoInputRef.current) videoInputRef.current.value = "";
          return;
        }
      } catch {
        // Si la durée ne peut pas être lue, on laisse passer plutôt que de bloquer l'envoi à tort.
      }
    }
    setUploading(true);
    try {
      const { url, mediaType } = await uploadMediaToCloudinary(file);
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ mediaUrl: url, mediaType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec de la publication.");
        setPosts((p) => [data.post, ...p]);
      } else {
        setPosts((p) => [{ id: Date.now(), media_url: url, media_type: mediaType, likeCount: 0, commentCount: 0, comments_enabled: 1, comments_permission: "everyone" }, ...p]);
      }
    } catch (err) {
      setError(err.message || "Échec de l'envoi.");
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ color: "#B39FBF", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Mes publications</label>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => photoInputRef.current?.click()} disabled={uploading} style={{
            display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 10, padding: "5px 10px", color: "#FBEFE9", fontSize: 11.5, cursor: uploading ? "default" : "pointer",
          }}>
            <Camera size={13} /> {uploading ? "Envoi..." : "Photo"}
          </button>
          <button onClick={() => videoInputRef.current?.click()} disabled={uploading} style={{
            display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 10, padding: "5px 10px", color: "#FBEFE9", fontSize: 11.5, cursor: uploading ? "default" : "pointer",
          }}>
            <Video size={13} /> {uploading ? "Envoi..." : "Vidéo"}
          </button>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleFile} style={{ display: "none" }} />
      </div>
      <p style={{ color: "#6B5A73", fontSize: 11, marginTop: 4 }}>Photos, ou vidéos de 10 secondes maximum. Likes, commentaires et cadeaux fonctionnent sur les deux.</p>
      {error && <p style={{ color: "#FF6B5B", fontSize: 11.5, marginTop: 6 }}>{error}</p>}
      <div style={{ marginTop: 10 }}>
        {loading && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Chargement...</p>}
        {!loading && posts.length === 0 && (
          <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Aucune publication pour l'instant. Ajoute une photo ou une vidéo !</p>
        )}
        <PostsGrid posts={posts} isOwner currentUserId={currentUserId} onOpen={setOpenPost} />
      </div>
      {openPost && (
        <PostDetailModal
          post={openPost} isOwner currentUserId={currentUserId}
          onClose={() => setOpenPost(null)}
          onDeleted={(id) => setPosts((p) => p.filter((x) => x.id !== id))}
          onUpdated={(id, patch) => setPosts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
        />
      )}
    </div>
  );
}

// Section publications affichée sur la fiche profil d'un match (lecture + like + commentaire, pas de réglages).
function UserPostsSection({ userId, currentUserId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(!!API_BASE);
  const [openPost, setOpenPost] = useState(null);

  useEffect(() => {
    if (!API_BASE || !userId) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${userId}/posts`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) return null;
  if (posts.length === 0) return null;

  return (
    <div style={{ marginTop: 22 }}>
      <p style={{ color: "#8C7A94", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Publications</p>
      <PostsGrid posts={posts} isOwner={false} currentUserId={currentUserId} onOpen={setOpenPost} />
      {openPost && (
        <PostDetailModal
          post={openPost} isOwner={false} currentUserId={currentUserId}
          onClose={() => setOpenPost(null)}
          onUpdated={(id, patch) => setPosts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
        />
      )}
    </div>
  );
}

function WalletModal({ onClose }) {
  const [coins, setCoins] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(!!API_BASE);
  const [error, setError] = useState("");

  const load = async () => {
    if (!API_BASE) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/me/wallet`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoins(data.coins ?? 0);
      setTransactions(data.transactions || []);
    } catch {
      setError("Impossible de charger ton portefeuille pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,6,14,0.9)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1B1223", borderRadius: 20, width: "100%", maxWidth: 420, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 18, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={18} color="#F2B84B" /> Mon portefeuille
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8C7A94", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "20px 18px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "#8C7A94", fontSize: 12, marginBottom: 6 }}>Solde actuel</p>
          <p style={{ color: "#F2B84B", fontFamily: "Manrope, sans-serif", fontSize: 34, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: 0 }}>
            <Coins size={26} /> {loading ? "..." : coins ?? 0}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
          <p style={{ color: "#8C7A94", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Historique</p>
          {error && (
            <div>
              <p style={{ color: "#FF6B5B", fontSize: 12, marginBottom: 8 }}>{error}</p>
              <button onClick={load} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#FBEFE9", borderRadius: 10, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Réessayer</button>
            </div>
          )}
          {!error && loading && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Chargement...</p>}
          {!error && !loading && transactions.length === 0 && <p style={{ color: "#8C7A94", fontSize: 12.5 }}>Aucun mouvement pour l'instant.</p>}
          {transactions.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p style={{ color: "#FBEFE9", fontSize: 12.5, margin: 0 }}>{t.reason}</p>
                <p style={{ color: "#6B5A73", fontSize: 10.5, margin: 0, marginTop: 2 }}>{formatMessageTime(t.created_at)}</p>
              </div>
              <span style={{ color: t.amount >= 0 ? "#3ECF6B" : "#FF6B5B", fontSize: 13.5, fontWeight: 600, flexShrink: 0, marginLeft: 10 }}>
                {t.amount >= 0 ? "+" : ""}{t.amount}
              </span>
            </div>
          ))}
        </div>
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
  const [invisible, setInvisible] = useState(false);
  const [invisibleSaving, setInvisibleSaving] = useState(false);
  const [showVisitors, setShowVisitors] = useState(false);
  const [pushStatus, setPushStatus] = useState("idle"); // "idle" | "enabling" | "enabled" | "error"
  const [pushError, setPushError] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [resendStatus, setResendStatus] = useState("idle"); // "idle" | "sending" | "sent" | "error"
  const [legalOpen, setLegalOpen] = useState(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [acceptGifts, setAcceptGifts] = useState(true);
  const [giftSendersRestriction, setGiftSendersRestriction] = useState("everyone");
  const [hideGiftCount, setHideGiftCount] = useState(false);
  const [giftPrefsSaving, setGiftPrefsSaving] = useState(false);

  const handleEnablePush = async () => {
    setPushStatus("enabling");
    setPushError("");
    try {
      await enablePushNotifications();
      setPushStatus("enabled");
    } catch (e) {
      setPushError(e.message || "Impossible d'activer les notifications.");
      setPushStatus("error");
    }
  };
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
          setInvisible(!!data.user.invisible);
          setEmailVerified(data.user.email_verified !== 0 && data.user.email_verified !== false);
          setAcceptGifts(data.user.accept_gifts !== 0 && data.user.accept_gifts !== false);
          setGiftSendersRestriction(data.user.gift_senders_restriction || "everyone");
          setHideGiftCount(!!data.user.hide_gift_count);
        }
      } catch {
        // Silencieux : on garde les valeurs par défaut si le chargement échoue.
      }
    })();
  }, []);

  const resendVerificationEmail = async () => {
    setResendStatus("sending");
    if (!API_BASE) { setResendStatus("sent"); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  };

  const saveGiftPrefs = async (patch) => {
    const next = { acceptGifts, giftSendersRestriction, hideGiftCount, ...patch };
    setAcceptGifts(next.acceptGifts);
    setGiftSendersRestriction(next.giftSendersRestriction);
    setHideGiftCount(next.hideGiftCount);
    setGiftPrefsSaving(true);
    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/api/me`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            acceptGifts: next.acceptGifts,
            giftSendersRestriction: next.giftSendersRestriction,
            hideGiftCount: next.hideGiftCount,
          }),
        });
      } catch {
        // Erreur passagère : on garde quand même le choix affiché, l'utilisateur peut réessayer en re-basculant.
      }
    }
    setGiftPrefsSaving(false);
  };

  const toggleInvisible = async () => {
    const next = !invisible;
    setInvisible(next);
    setInvisibleSaving(true);
    if (API_BASE) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/api/me`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ invisible: next }),
        });
      } catch {
        setInvisible(!next);
      }
    }
    setInvisibleSaving(false);
  };

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
      <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 24, fontWeight: 600, color: "#FBEFE9" }}>Mon profil</span>

      {!emailVerified && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "rgba(242,184,75,0.12)", border: "1px solid rgba(242,184,75,0.35)" }}>
          <p style={{ color: "#F2B84B", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>📧 Confirme ton adresse email</p>
          <p style={{ color: "#D8C4D0", fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
            Vérifie ta boîte mail (et tes spams) pour confirmer ton compte. Tant que ce n'est pas fait, tu ne peux pas liker de profils.
          </p>
          {resendStatus === "sent" ? (
            <p style={{ color: "#3ECF6B", fontSize: 12 }}>Email renvoyé ✓</p>
          ) : (
            <button onClick={resendVerificationEmail} disabled={resendStatus === "sending"} style={{
              background: "rgba(242,184,75,0.2)", border: "1px solid rgba(242,184,75,0.4)", color: "#F2B84B",
              borderRadius: 10, padding: "6px 12px", fontSize: 12, cursor: "pointer",
            }}>{resendStatus === "sending" ? "Envoi..." : "Renvoyer l'email"}</button>
          )}
          {resendStatus === "error" && <p style={{ color: "#FF6B5B", fontSize: 11.5, marginTop: 6 }}>Échec de l'envoi. Réessaie dans un instant.</p>}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)",
          padding: 3, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: "100%", height: "100%", borderRadius: "50%", background: "#3A2645", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #0A0611",
          }}>
            {photos[0] ? (
              <img src={photos[0]} alt="Photo de profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <User size={40} color="#F2B84B" />
            )}
          </div>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{
          background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)",
          color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 20, fontWeight: 700, textAlign: "center",
          marginTop: 14, padding: "4px 0", outline: "none", width: 200,
        }} />
        {verificationStatus === "verified" && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#A78BFA", fontSize: 12.5, marginTop: 6 }}>
            <BadgeCheck size={15} /> Profil vérifié
          </span>
        )}
      </div>

      <div style={{ marginTop: 22, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BadgeCheck size={17} color={verificationStatus === "verified" ? "#A78BFA" : "#8C7A94"} />
          <span style={{ color: "#FBEFE9", fontSize: 14, fontWeight: 600 }}>Badge de vérification</span>
        </div>

        {verificationStatus === "verified" && (
          <p style={{ color: "#A78BFA", fontSize: 13, marginTop: 8 }}>Ton profil est vérifié ✓</p>
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
                background: "rgba(79,168,255,0.15)", color: "#A78BFA", border: "1px solid rgba(79,168,255,0.4)",
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
          marginTop: 20, width: "100%", padding: "14px 0", borderRadius: 999, cursor: saving ? "default" : "pointer",
          background: saved ? "#6BE0A8" : "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)",
          color: saved ? "#0F3322" : "#2A0E12", border: "none", fontSize: 14.5, fontWeight: 800, fontFamily: "Manrope, sans-serif",
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer les modifications"}
        </button>
      )}

      <div style={{ marginTop: 20, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#FBEFE9", fontSize: 14, fontWeight: 600 }}>
            <EyeOff size={17} color={invisible ? "#F2B84B" : "#8C7A94"} /> Mode invisible
          </span>
          <button onClick={toggleInvisible} disabled={invisibleSaving || !API_BASE} style={{
            width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer",
            background: invisible ? "#F2B84B" : "rgba(255,255,255,0.2)", position: "relative", transition: "background 0.2s",
          }}>
            <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#1B1223", position: "absolute", top: 2.5, left: invisible ? 21 : 2, transition: "left 0.2s" }} />
          </button>
        </div>
        <p style={{ color: "#B39FBF", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
          {invisible ? "Ton profil n'apparaît plus dans Découvrir pour les autres." : "Active pour naviguer sans apparaître aux autres."}
        </p>
      </div>

      <button onClick={() => setShowVisitors(true)} style={{
        marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 14, cursor: "pointer",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        color: "#FBEFE9", fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Eye size={16} color="#8C7A94" /> Qui a visité mon profil</span>
        <span style={{ color: "#8C7A94", fontSize: 12 }}>›</span>
      </button>

      <button onClick={() => setShowMyPosts((s) => !s)} style={{
        marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 14, cursor: "pointer",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        color: "#FBEFE9", fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Video size={16} color="#8C7A94" /> Mes publications</span>
        <ChevronRight size={16} color="#8C7A94" style={{ transform: showMyPosts ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {showMyPosts && <MyPostsSection currentUserId={user?.id} />}

      <button onClick={() => setShowWallet(true)} style={{
        marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 14, cursor: "pointer",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        color: "#FBEFE9", fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Wallet size={16} color="#F2B84B" /> Mon portefeuille (Coins)</span>
        <span style={{ color: "#8C7A94", fontSize: 12 }}>›</span>
      </button>

      <div style={{ marginTop: 12, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#FBEFE9", fontSize: 14, fontWeight: 600 }}>
            <Gift size={17} color="#F2B84B" /> Réception des cadeaux
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ color: "#D8C4D0", fontSize: 13 }}>Accepter les cadeaux</span>
          <button onClick={() => saveGiftPrefs({ acceptGifts: !acceptGifts })} disabled={giftPrefsSaving || !API_BASE} style={{
            width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer",
            background: acceptGifts ? "#F2B84B" : "rgba(255,255,255,0.2)", position: "relative", transition: "background 0.2s",
          }}>
            <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#1B1223", position: "absolute", top: 2.5, left: acceptGifts ? 21 : 2, transition: "left 0.2s" }} />
          </button>
        </div>

        {acceptGifts && (
          <>
            <p style={{ color: "#D8C4D0", fontSize: 13, marginTop: 16, marginBottom: 8 }}>Qui peut m'envoyer des cadeaux</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => saveGiftPrefs({ giftSendersRestriction: "everyone" })} style={{
                flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", fontSize: 12.5,
                background: giftSendersRestriction === "everyone" ? "#FF6B5B" : "rgba(255,255,255,0.08)",
                color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
              }}>Tout le monde</button>
              <button onClick={() => saveGiftPrefs({ giftSendersRestriction: "verified_only" })} style={{
                flex: 1, padding: "9px 0", borderRadius: 12, cursor: "pointer", fontSize: 12.5,
                background: giftSendersRestriction === "verified_only" ? "#FF6B5B" : "rgba(255,255,255,0.08)",
                color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)",
              }}>Profils vérifiés</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ color: "#D8C4D0", fontSize: 13 }}>Masquer le compteur de cadeaux</span>
              <button onClick={() => saveGiftPrefs({ hideGiftCount: !hideGiftCount })} disabled={giftPrefsSaving || !API_BASE} style={{
                width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer",
                background: hideGiftCount ? "#F2B84B" : "rgba(255,255,255,0.2)", position: "relative", transition: "background 0.2s",
              }}>
                <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#1B1223", position: "absolute", top: 2.5, left: hideGiftCount ? 21 : 2, transition: "left 0.2s" }} />
              </button>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleEnablePush}
        disabled={pushStatus === "enabling" || pushStatus === "enabled" || !API_BASE}
        style={{
          marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 14, cursor: pushStatus === "enabled" ? "default" : "pointer",
          background: pushStatus === "enabled" ? "rgba(107,224,168,0.12)" : "rgba(255,255,255,0.06)",
          border: pushStatus === "enabled" ? "1px solid rgba(107,224,168,0.4)" : "1px solid rgba(255,255,255,0.12)",
          color: "#FBEFE9", fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BadgeCheck size={16} color={pushStatus === "enabled" ? "#6BE0A8" : "#8C7A94"} />
          {pushStatus === "enabled" ? "Notifications activées ✓" : pushStatus === "enabling" ? "Activation..." : "Activer les notifications push"}
        </span>
      </button>
      {pushError && <p style={{ color: "#FF6B5B", fontSize: 11.5, marginTop: 6 }}>{pushError}</p>}

      {showVisitors && <VisitorsModal onClose={() => setShowVisitors(false)} />}
      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}

      <div style={{ marginTop: 20, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16 }}>
        <p style={{ color: "#D8C4D0", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          L'ajout de photos, le mode invisible et les visiteurs sont disponibles dès maintenant. La vérification d'identité par selfie est déjà active un peu plus haut.
        </p>
      </div>

      <button onClick={onLogout} style={{
        marginTop: 16, width: "100%", padding: "13px 0", borderRadius: 999, cursor: "pointer",
        background: "rgba(255,255,255,0.06)", color: "#FF6B5B", border: "1px solid rgba(255,107,91,0.35)", fontSize: 14, fontFamily: "Manrope, sans-serif", fontWeight: 700,
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

      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setLegalOpen("terms")} style={{ background: "none", border: "none", color: "#6B5A73", fontSize: 11.5, textDecoration: "underline", cursor: "pointer" }}>
          Conditions d'utilisation
        </button>
        <button onClick={() => setLegalOpen("privacy")} style={{ background: "none", border: "none", color: "#6B5A73", fontSize: 11.5, textDecoration: "underline", cursor: "pointer" }}>
          Politique de confidentialité
        </button>
        <button onClick={() => setLegalOpen("child-safety")} style={{ background: "none", border: "none", color: "#6B5A73", fontSize: 11.5, textDecoration: "underline", cursor: "pointer" }}>
          Sécurité des mineurs
        </button>
      </div>
      {legalOpen && <LegalModal type={legalOpen} onClose={() => setLegalOpen(null)} />}
    </div>
  );
}

const GENRES = ["Homme", "Femme"];
const GENRES_RECHERCHE = ["Homme", "Femme", "Tous"];
const REGISTER_STEPS = ["compte", "details", "interets", "intention", "photos", "consentement"];
const GOOGLE_COMPLETION_STEPS = ["details", "interets", "intention", "photos", "consentement"];

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

const PRIVACY_POLICY_TEXT = `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}

1. QUI SOMMES-NOUS
Lovinia (« nous », « l'application ») est un service de rencontres en ligne accessible via lovinia.fr et ses applications associées. La présente politique explique quelles données nous collectons, pourquoi, et quels sont tes droits.

2. DONNÉES COLLECTÉES
- Données de compte : nom, email, mot de passe (chiffré), date de naissance.
- Données de profil : photos, vidéos, bio, ville, profession, centres d'intérêt, préférences de rencontre.
- Données de vérification : selfie de vérification d'identité (examiné puis conservé le temps nécessaire à la modération).
- Données d'usage : likes, matchs, messages échangés, publications, commentaires, cadeaux envoyés/reçus.
- Données techniques : adresse IP (à des fins de sécurité et de lutte contre les abus), dernière activité (statut « en ligne »), jeton de notification push si activé.
- Données de localisation : ville ou position approximative si tu actives cette fonctionnalité, utilisée pour te proposer des profils à proximité.

3. POURQUOI NOUS UTILISONS CES DONNÉES
- Faire fonctionner le service (affichage de profils, matchs, messagerie, notifications).
- Assurer la sécurité : modération des contenus, détection de faux comptes, lutte contre les abus, vérification d'âge et d'identité.
- Améliorer le service et personnaliser l'expérience (suggestions de profils, boutique de cadeaux, etc.).
- Respecter nos obligations légales.

4. AVEC QUI CES DONNÉES SONT PARTAGÉES
Nous ne vendons jamais tes données. Elles peuvent être traitées par des prestataires techniques strictement nécessaires au fonctionnement du service : hébergement (Railway), stockage des photos/vidéos (Cloudinary), envoi d'emails transactionnels (Brevo), notifications push (infrastructure standard des navigateurs). Ces prestataires n'ont accès qu'aux données nécessaires à leur mission et sont tenus à la confidentialité.

5. COORDONNÉES PERSONNELLES DANS LA MESSAGERIE
Pour ta sécurité, l'échange de coordonnées personnelles externes (téléphone, email, réseaux sociaux, liens) dans la messagerie interne n'est autorisé qu'entre deux profils vérifiés. Cette détection est automatisée et n'implique pas de lecture humaine systématique de tes messages.

6. DURÉE DE CONSERVATION
Tes données sont conservées tant que ton compte est actif. En cas de suppression de compte, tes données personnelles sont supprimées ou anonymisées dans un délai raisonnable, sauf obligation légale de conservation plus longue (ex : lutte contre la fraude).

7. TES DROITS
Conformément au RGPD, tu disposes d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de tes données. Tu peux exercer ces droits en nous contactant à l'adresse indiquée dans l'application. Tu disposes également du droit d'introduire une réclamation auprès de la CNIL (France) ou de l'autorité de contrôle compétente.

8. SÉCURITÉ
Les mots de passe sont stockés de façon chiffrée. L'accès aux données est restreint aux personnes en ayant besoin dans le cadre de la modération et du support.

9. ÂGE MINIMUM
Lovinia est strictement réservé aux personnes de 18 ans et plus. Tout compte dont l'âge ne peut être confirmé conforme à cette règle peut être suspendu.

10. MODIFICATIONS
Cette politique peut être mise à jour. Les changements significatifs te seront notifiés dans l'application.

Pour toute question relative à tes données personnelles, contacte-nous via les coordonnées disponibles dans l'application.`;

const TERMS_OF_SERVICE_TEXT = `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}

1. OBJET
Les présentes Conditions d'utilisation régissent l'accès et l'usage de l'application Lovinia, service de mise en relation à but de rencontre entre personnes majeures.

2. ÂGE MINIMUM ET ÉLIGIBILITÉ
L'inscription est strictement réservée aux personnes majeures (18 ans ou plus). En créant un compte, tu certifies avoir l'âge requis et que les informations fournies sont exactes. Toute fausse déclaration sur ton âge peut entraîner la suspension immédiate et définitive de ton compte.

3. COMPTE UTILISATEUR
Tu es responsable de la confidentialité de ton mot de passe et de toute activité effectuée depuis ton compte. Un seul compte par personne est autorisé.

4. RÈGLES DE CONDUITE
En utilisant Lovinia, tu t'engages à :
- Ne publier aucun contenu illégal, haineux, violent, sexuellement explicite non consenti, ou portant atteinte aux droits d'autrui.
- Ne pas usurper l'identité d'un tiers ni créer de faux profil.
- Ne pas harceler, menacer ou abuser d'autres utilisateurs.
- Ne pas utiliser le service à des fins commerciales, publicitaires ou frauduleuses non autorisées.
- Respecter les autres membres et signaler tout comportement inapproprié via les outils prévus (signalement, blocage).

5. MODÉRATION DES CONTENUS
Les photos et vidéos publiées sur ton profil sont soumises à une validation avant publication. Lovinia se réserve le droit de refuser, suspendre ou supprimer tout contenu ou compte ne respectant pas ces règles, sans préavis en cas de manquement grave.

6. VÉRIFICATION D'IDENTITÉ ET BADGE VÉRIFIÉ
Un système de vérification par selfie est disponible pour obtenir un badge de profil vérifié. Certaines fonctionnalités (envoi/réception de cadeaux, échange de coordonnées personnelles) peuvent être conditionnées à cette vérification.

7. COINS ET ACHATS VIRTUELS
Lovinia propose des fonctionnalités payantes réglées en Coins (monnaie virtuelle interne), notamment des cadeaux virtuels. Les Coins n'ont pas de valeur monétaire réelle en dehors de l'application et ne sont ni remboursables ni convertibles en argent réel, sauf disposition légale contraire.

8. PROPRIÉTÉ INTELLECTUELLE
Le contenu que tu publies (photos, vidéos, textes) reste ta propriété. En le publiant, tu accordes à Lovinia une licence non exclusive nécessaire à l'affichage de ce contenu au sein du service.

9. RESPONSABILITÉ
Lovinia met en relation des utilisateurs mais ne peut garantir l'exactitude des informations fournies par chacun ni la sécurité des rencontres organisées en dehors de l'application. Chaque utilisateur reste responsable de ses interactions et est invité à rester prudent, notamment lors de premières rencontres physiques.

10. SUSPENSION ET RÉSILIATION
Lovinia peut suspendre ou supprimer tout compte en cas de non-respect des présentes conditions, de comportement frauduleux, ou de signalement fondé par d'autres utilisateurs. Tu peux supprimer ton compte à tout moment depuis les réglages.

11. MODIFICATIONS
Les présentes conditions peuvent évoluer. Les utilisateurs seront informés de toute modification substantielle.

12. CONTACT
Pour toute question relative à ces conditions, contacte-nous via les coordonnées disponibles dans l'application.`;

const CHILD_SAFETY_STANDARDS_TEXT = `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}

1. ENGAGEMENT
Lovinia a une politique de tolérance zéro envers l'exploitation et les abus sexuels sur mineurs (CSAE — Child Sexual Abuse and Exploitation), sous toute forme, y compris la sollicitation, le partage de contenu, ou toute tentative de mise en relation impliquant un mineur.

2. ÂGE MINIMUM ET VÉRIFICATION
Lovinia est strictement réservé aux personnes de 18 ans et plus.
- La date de naissance est obligatoire et vérifiée à l'inscription ; toute personne déclarant moins de 18 ans est automatiquement refusée.
- Cette vérification s'applique aussi à toute modification ultérieure du profil.
- Les comptes suspectés d'appartenir à un mineur, quelle que soit la date de naissance déclarée, peuvent être suspendus par un modérateur en cas de doute raisonnable (photos, contenu, signalement).

3. MODÉRATION DES CONTENUS
- Toute photo ou vidéo publiée sur l'application passe par une file de modération avant d'être visible par les autres utilisateurs.
- Le contenu suspecté de représenter un mineur, ou à caractère sexuel impliquant potentiellement un mineur, est immédiatement rejeté et le compte concerné suspendu dans l'attente d'investigation.

4. DÉTECTION ET SIGNALEMENT
- Chaque profil, publication, message et commentaire peut être signalé directement depuis l'application par n'importe quel utilisateur.
- Les signalements concernant un mineur (présumé ou avéré) sont traités en priorité absolue.
- Lovinia coopère avec les autorités compétentes et les organismes de protection de l'enfance (tels que le NCMEC aux États-Unis ou les autorités locales équivalentes) en cas de détection de contenu ou de comportement relevant du CSAE, conformément aux obligations légales applicables.

5. POINT DE CONTACT SÉCURITÉ DÉSIGNÉ
Pour tout signalement urgent concernant la sécurité d'un mineur, ou toute question relative à cette politique :
Email : safety@lovinia.fr
Ce contact est traité en priorité et distinct du support client général.

6. ACTIONS EN CAS DE VIOLATION
Toute violation avérée de cette politique entraîne :
- La suspension immédiate et définitive du compte concerné.
- La conservation des preuves nécessaires à une éventuelle procédure judiciaire.
- Le signalement aux autorités compétentes lorsque la loi l'exige ou le permet.

7. PRÉVENTION
Lovinia met en œuvre les mesures suivantes pour prévenir les abus :
- Vérification d'identité par selfie disponible (badge de vérification), utilisée notamment pour renforcer la confiance entre utilisateurs.
- Restriction de l'échange de coordonnées personnelles externes aux seuls comptes vérifiés, réduisant les tentatives de contournement de la modération.
- Limitation du taux de création de comptes (anti-abus) pour freiner la création de faux comptes en masse.

8. CONTACT GÉNÉRAL
Pour toute autre question, contacte-nous via les coordonnées disponibles dans l'application ou à contact@lovinia.fr.`;

function LegalModal({ type, onClose }) {
  const titles = { privacy: "Politique de confidentialité", terms: "Conditions d'utilisation", "child-safety": "Standards de protection des mineurs" };
  const texts = { privacy: PRIVACY_POLICY_TEXT, terms: TERMS_OF_SERVICE_TEXT, "child-safety": CHILD_SAFETY_STANDARDS_TEXT };
  const title = titles[type] || titles.privacy;
  const text = texts[type] || texts.privacy;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,6,14,0.92)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1B1223", borderRadius: 18, width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8C7A94", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div style={{ padding: "16px 18px", overflowY: "auto" }}>
          <p style={{ color: "#D8C4D0", fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{text}</p>
        </div>
      </div>
    </div>
  );
}

// Page légale publique, accessible SANS connexion (ex: lovinia.fr/legal?doc=privacy) —
// nécessaire pour la soumission Google Play / Apple, qui exigent un lien public direct.
function PublicLegalScreen() {
  const doc = new URLSearchParams(window.location.search).get("doc") || "privacy";
  const titles = { privacy: "Politique de confidentialité", terms: "Conditions d'utilisation", "child-safety": "Standards de protection des mineurs" };
  const texts = { privacy: PRIVACY_POLICY_TEXT, terms: TERMS_OF_SERVICE_TEXT, "child-safety": CHILD_SAFETY_STANDARDS_TEXT };
  const title = titles[doc] || titles.privacy;
  const text = texts[doc] || texts.privacy;
  return (
    <div style={{ minHeight: "100vh", background: "#0A0611", padding: "48px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <p style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 22, color: "#FBEFE9", marginBottom: 6 }}>Lovinia</p>
        <p style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 26, color: "#FBEFE9", marginBottom: 24 }}>{title}</p>
        <p style={{ color: "#D8C4D0", fontSize: 13.5, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{text}</p>
        <div style={{ marginTop: 40, display: "flex", gap: 16 }}>
          <a href="/legal?doc=privacy" style={{ color: "#F2B84B", fontSize: 12.5, textDecoration: "underline" }}>Confidentialité</a>
          <a href="/legal?doc=terms" style={{ color: "#F2B84B", fontSize: 12.5, textDecoration: "underline" }}>CGU</a>
          <a href="/legal?doc=child-safety" style={{ color: "#F2B84B", fontSize: 12.5, textDecoration: "underline" }}>Sécurité des mineurs</a>
        </div>
      </div>
    </div>
  );
}

function OnboardingScreens({ onDone }) {
  const [step, setStep] = useState(0); // 0 = Bienvenue, 1 = Philosophie

  const dots = (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 18 }}>
      {[0, 1].map((i) => (
        <div key={i} style={{
          width: i === step ? 22 : 7, height: 7, borderRadius: 999, transition: "width 0.25s",
          background: i === step ? "linear-gradient(120deg, #FF6B5B, #E8548A, #9B5DE5)" : "rgba(255,255,255,0.18)",
        }} />
      ))}
    </div>
  );

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
      background: "radial-gradient(900px 500px at 20% -10%, rgba(155,93,229,0.25), transparent 60%), radial-gradient(700px 500px at 100% 10%, rgba(232,84,138,0.2), transparent 55%), #0A0611",
    }}>
      {/* Halo décoratif animé en fond, façon "glow" premium */}
      <div style={{
        position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)",
        width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,91,0.35), transparent 70%)",
        filter: "blur(10px)", animation: "onboardGlow 5s ease-in-out infinite",
      }} />
      <style>{`
        @keyframes onboardGlow { 0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.12); } }
        @keyframes floatIcon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes walkGlow { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
      `}</style>

      <div style={{ flex: 1, overflowY: "auto", padding: "40px 26px 10px", position: "relative", zIndex: 1 }}>
        {step === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ position: "relative", width: 90, height: 70, marginBottom: 14 }}>
              <Heart size={64} color="#FF6B5B" style={{ position: "absolute", left: 0, top: 6 }} />
              <Heart size={64} fill="#E8548A" color="#E8548A" style={{ position: "absolute", right: 0, top: 0 }} />
            </div>
            <p style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 34, color: "#FBEFE9", margin: 0 }}>Lovinia</p>
            <p style={{
              fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: "0.12em",
              background: "linear-gradient(120deg, #FF6B5B, #E8548A)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              marginTop: 4, textTransform: "uppercase",
            }}>Connectez les cœurs</p>

            <p style={{ color: "#C6B4C9", fontSize: 13.5, lineHeight: 1.7, marginTop: 18, maxWidth: 300 }}>
              Lovinia est l'application de rencontre qui vous aide à créer de vraies connexions.
              Sécurisée, authentique et conçue pour des relations qui ont du sens.
            </p>

            <div style={{ width: "100%", marginTop: 26, display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
              {[
                { icon: <BadgeCheck size={19} color="#A78BFA" />, title: "Profils vérifiés", desc: "Badge bleu après vérification selfie, pour plus de confiance." },
                { icon: <Heart size={19} color="#FF6B5B" fill="#FF6B5B" />, title: "Matchs de qualité", desc: "Des connexions basées sur vos préférences et vos centres d'intérêt." },
                { icon: <Lock size={19} color="#F2B84B" />, title: "Sécurisé & privé", desc: "Vos données sont protégées, votre sécurité est notre priorité." },
                { icon: <Gem size={19} color="#E8548A" />, title: "Expérience Premium", desc: "Options VIP pour profiter de toutes les fonctionnalités sans limites." },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13.5, margin: 0 }}>{f.title}</p>
                    <p style={{ color: "#8B7A93", fontSize: 12, margin: "2px 0 0", lineHeight: 1.4 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              width: "100%", marginTop: 28, background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, padding: 16, backdropFilter: "blur(16px)",
            }}>
              <p style={{
                textAlign: "center", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em",
                color: "#E8548A", textTransform: "uppercase", margin: "0 0 12px",
              }}>Fonctionnalités clés</p>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, display: "flex", gap: 8 }}>
                  <User size={16} color="#A78BFA" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ color: "#FBEFE9", fontSize: 12, fontWeight: 700, margin: 0 }}>Matchs limités</p>
                    <p style={{ color: "#8B7A93", fontSize: 10.5, margin: "2px 0 0" }}>Hommes : 20/jour<br />Femmes : 40/jour</p>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", gap: 8 }}>
                  <MessageCircle size={16} color="#A78BFA" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ color: "#FBEFE9", fontSize: 12, fontWeight: 700, margin: 0 }}>Messagerie</p>
                    <p style={{ color: "#8B7A93", fontSize: 10.5, margin: "2px 0 0" }}>Discute uniquement avec tes matchs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ position: "relative", width: 60, height: 46, marginBottom: 10 }}>
              <Heart size={40} color="#FF6B5B" style={{ position: "absolute", left: 0, top: 4 }} />
              <Heart size={40} fill="#E8548A" color="#E8548A" style={{ position: "absolute", right: 0, top: 0 }} />
            </div>
            <p style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 22, color: "#FBEFE9", margin: 0 }}>Lovinia</p>
            <p style={{
              fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.12em",
              color: "#E8548A", marginTop: 2, textTransform: "uppercase",
            }}>Connectez les cœurs</p>

            {/* Arche VIP stylisée, façon "porte lumineuse" avec icônes flottantes */}
            <div style={{ position: "relative", width: "100%", maxWidth: 280, height: 220, marginTop: 22 }}>
              {[
                { icon: <Star size={18} color="#F2B84B" />, top: 6, left: 30 },
                { icon: <Crown size={18} color="#F2B84B" />, top: 0, right: 20 },
                { icon: <Gem size={18} color="#A78BFA" />, top: 60, left: 0 },
                { icon: <Zap size={18} color="#A78BFA" />, top: 55, right: -4 },
              ].map((it, i) => (
                <div key={i} style={{
                  position: "absolute", top: it.top, left: it.left, right: it.right,
                  width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(242,184,75,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
                  animation: `floatIcon ${2.6 + i * 0.4}s ease-in-out infinite`,
                }}>{it.icon}</div>
              ))}
              <div style={{
                position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: 130, height: 170, borderRadius: "70px 70px 0 0",
                background: "linear-gradient(180deg, rgba(232,84,138,0.16), rgba(155,93,229,0.1))",
                border: "2px solid rgba(232,84,138,0.5)", boxShadow: "0 0 40px rgba(232,84,138,0.35)",
                display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 14,
              }}>
                <p style={{
                  fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "0.06em",
                  background: "linear-gradient(120deg, #F2B84B, #FF6B5B)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                }}>VIP</p>
              </div>
              <div style={{
                position: "absolute", bottom: 6, left: 0, right: 0, height: 3, borderRadius: 2,
                background: "linear-gradient(90deg, #9B5DE5, #E8548A, #F2B84B, #9B5DE5)",
                backgroundSize: "200% 100%", animation: "walkGlow 3s linear infinite",
              }} />
            </div>

            <div style={{
              width: "100%", marginTop: 20, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)",
              borderRadius: 18, padding: "14px 18px",
            }}>
              <p style={{ color: "#A78BFA", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Gratuit</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, textAlign: "left" }}>
                {["Inscription", "Matchs", "Messages", "Rencontres"].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={14} color="#3ECF6B" /> <span style={{ color: "#FBEFE9", fontSize: 12.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 1.5, marginTop: 22 }}>
              Rencontrez <span style={{ color: "#3ECF6B" }}>gratuitement</span>.<br />
              Passez au <span style={{
                background: "linear-gradient(120deg, #F2B84B, #FF6B5B)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              }}>VIP</span> uniquement si vous voulez aller plus loin.
            </p>

            <div style={{ display: "flex", gap: 22, marginTop: 22 }}>
              {[
                { icon: <Heart size={20} color="#FF6B5B" fill="#FF6B5B" />, label: "L'amour est gratuit" },
                { icon: <Gem size={20} color="#E8548A" />, label: "Avantages Premium" },
                { icon: <Crown size={20} color="#F2B84B" />, label: "Allez plus loin en VIP" },
              ].map((it, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 78 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                    {it.icon}
                  </div>
                  <p style={{ color: "#C6B4C9", fontSize: 10, textAlign: "center", lineHeight: 1.3, margin: 0, fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>{it.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 26px 30px", position: "relative", zIndex: 1 }}>
        {dots}
        <button
          onClick={() => (step === 0 ? setStep(1) : onDone())}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 999, border: "none", cursor: "pointer",
            background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)",
            color: "#2A0E12", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 15,
          }}
        >
          Suivant
        </button>
        {step === 0 && (
          <button onClick={onDone} style={{ width: "100%", background: "none", border: "none", color: "#6B5A73", fontSize: 12.5, marginTop: 12, cursor: "pointer", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
            Passer
          </button>
        )}
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("register"); // "register" | "login" | "complete-google"
  const [step, setStep] = useState(0);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    birthdate: "", genre: "", genre_recherche: "Tous", city: "", profession: "", taille: "",
    interests: [], langues: [], intention: "", photos: [], acceptedTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [legalOpen, setLegalOpen] = useState(null); // "privacy" | "terms" | null

  const calcAgeClient = (birthdate) => {
    if (!birthdate) return null;
    const dob = new Date(birthdate);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const steps = mode === "complete-google" ? GOOGLE_COMPLETION_STEPS : REGISTER_STEPS;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = () => {
    if (mode === "login") return true;
    const s = steps[step];
    if (s === "compte" && (!form.name || !form.email || !form.password)) return "Merci de remplir tous les champs.";
    if (s === "details" && (!form.birthdate || !form.genre || !form.city)) return "Merci de compléter tes informations.";
    if (s === "details") {
      const age = calcAgeClient(form.birthdate);
      if (age === null) return "Date de naissance invalide.";
      if (age < 18) return "Lovinia est réservé aux personnes majeures. Tu dois avoir au moins 18 ans pour t'inscrire.";
    }
    if (s === "intention" && !form.intention) return "Choisis ce que tu recherches sur Lovinia.";
    if (s === "photos" && form.photos.length < 2) return "Ajoute au moins 2 photos pour continuer.";
    if (s === "consentement" && !form.acceptedTerms) return "Tu dois accepter les Conditions d'utilisation et la Politique de confidentialité pour continuer.";
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
          <p style={{ fontFamily: "Manrope, sans-serif", fontSize: 32, color: "#FBEFE9", fontWeight: 700, margin: "10px 0 0" }}>Lovinia</p>
          <p style={{ color: "#E89BB0", fontSize: 11.5, letterSpacing: 1.5, textTransform: "uppercase", margin: "2px 0 10px" }}>Connectez les cœurs</p>
          <p style={{ fontFamily: "Manrope, sans-serif", fontSize: 20, color: "#F2B84B", fontWeight: 600, margin: "2px 0 8px" }}>Bon retour</p>
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
          marginTop: 18, padding: "13px 0", borderRadius: 999, cursor: loading ? "default" : "pointer",
          background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)", color: "#2A0E12", border: "none", fontSize: 15, fontWeight: 800, fontFamily: "Manrope, sans-serif",
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
        <p style={{ fontFamily: "Manrope, sans-serif", fontSize: 24, color: "#FBEFE9", fontWeight: 700, margin: "8px 0 0" }}>Lovinia</p>
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
            <p style={{ color: "#F2B84B", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Créons ton compte</p>

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
            <p style={{ color: "#F2B84B", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Parle-nous de toi</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#B39FBF", fontSize: 12 }}>Date de naissance</label>
              <div style={{ ...fieldWrap, marginTop: 6 }}>
                <input
                  type="date" value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                  style={{ ...fieldInput, colorScheme: "dark" }}
                />
              </div>
              <p style={{ color: "#6B5A73", fontSize: 11, marginTop: 4 }}>Lovinia est réservé aux personnes de 18 ans et plus.</p>
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
            <p style={{ color: "#F2B84B", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Tes centres d'intérêt</p>
            <TagInput label="Centres d'intérêt" values={form.interests} onChange={(v) => set("interests", v)} placeholder="Ex: Musique, Voyage..." />
            <TagInput label="Langues parlées" values={form.langues} onChange={(v) => set("langues", v)} placeholder="Ex: Français, Anglais..." />
          </>
        )}

        {stepName === "intention" && (
          <>
            <p style={{ color: "#F2B84B", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Tu recherches...</p>
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
            <p style={{ color: "#F2B84B", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Ajoute tes photos</p>
            <PhotoUploader photos={form.photos} onChange={(v) => set("photos", v)} />
          </>
        )}

        {stepName === "consentement" && (
          <>
            <p style={{ color: "#F2B84B", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Dernière étape</p>
            <p style={{ color: "#D8C4D0", fontSize: 13.5, lineHeight: 1.6, marginBottom: 18 }}>
              Avant de créer ton compte, merci de confirmer les points suivants.
            </p>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
              <input
                type="checkbox" checked={form.acceptedTerms} onChange={(e) => set("acceptedTerms", e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ color: "#FBEFE9", fontSize: 13, lineHeight: 1.5 }}>
                Je certifie avoir au moins 18 ans et j'accepte les{" "}
                <span onClick={(e) => { e.preventDefault(); setLegalOpen("terms"); }} style={{ color: "#F2B84B", textDecoration: "underline", cursor: "pointer" }}>
                  Conditions d'utilisation
                </span>{" "}
                et la{" "}
                <span onClick={(e) => { e.preventDefault(); setLegalOpen("privacy"); }} style={{ color: "#F2B84B", textDecoration: "underline", cursor: "pointer" }}>
                  Politique de confidentialité
                </span>{" "}
                de Lovinia.
              </span>
            </label>
          </>
        )}
      </div>

      {legalOpen && <LegalModal type={legalOpen} onClose={() => setLegalOpen(null)} />}

      {error && <p style={{ color: "#FF6B5B", fontSize: 12, margin: "10px 0 0" }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <button onClick={goBack} style={{
            flex: 1, padding: "13px 0", borderRadius: 14, cursor: "pointer",
            background: "rgba(255,255,255,0.08)", color: "#FBEFE9", border: "1px solid rgba(255,255,255,0.14)", fontSize: 14,
          }}>Retour</button>
        )}
        <button onClick={goNext} disabled={loading} style={{
          flex: 2, padding: "13px 0", borderRadius: 999, cursor: loading ? "default" : "pointer",
          background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)", color: "#2A0E12", border: "none", fontSize: 15, fontWeight: 800, fontFamily: "Manrope, sans-serif",
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

function GiftsAdminSection({ adminKey }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newGift, setNewGift] = useState({ name: "", icon: "", priceCoins: "" });
  const [creating, setCreating] = useState(false);
  const [revenue, setRevenue] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [gRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/gifts`, { headers: { "x-admin-key": adminKey } }),
        fetch(`${API_BASE}/api/admin/revenue`, { headers: { "x-admin-key": adminKey } }),
      ]);
      const gData = await gRes.json();
      setGifts(gData.gifts || []);
      if (rRes.ok) setRevenue(await rRes.json());
    } catch {
      setError("Impossible de charger la boutique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateGift = async (id, patch) => {
    setGifts((g) => g.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      await fetch(`${API_BASE}/api/admin/gifts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          name: patch.name, icon: patch.icon,
          priceCoins: patch.price_coins != null ? Number(patch.price_coins) : undefined,
          active: patch.active != null ? !!patch.active : undefined,
        }),
      });
    } catch {
      setError("Une modification n'a pas pu être enregistrée. Réessaie.");
    }
  };

  const createGift = async () => {
    if (!newGift.name || !newGift.icon || !newGift.priceCoins) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ name: newGift.name, icon: newGift.icon, priceCoins: Number(newGift.priceCoins) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Création impossible.");
      setGifts((g) => [...g, data.gift]);
      setNewGift({ name: "", icon: "", priceCoins: "" });
    } catch (e) {
      setError(e.message || "Erreur de création.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 24, marginBottom: 6 }}>Boutique de cadeaux</p>
      <p style={{ color: "#8C7A94", fontSize: 12.5, marginBottom: 16 }}>Le destinataire d'un cadeau reçoit 70% de sa valeur en Coins ; 30% reviennent à la plateforme.</p>

      {revenue && (
        <div style={{ background: "rgba(242,184,75,0.1)", border: "1px solid rgba(242,184,75,0.3)", borderRadius: 14, padding: 16, marginBottom: 20, display: "flex", gap: 24 }}>
          <div>
            <p style={{ color: "#8C7A94", fontSize: 11, marginBottom: 4 }}>Revenu plateforme (commission 30%)</p>
            <p style={{ color: "#F2B84B", fontFamily: "Manrope, sans-serif", fontSize: 22, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Coins size={18} /> {revenue.totalCoins}
            </p>
          </div>
          <div>
            <p style={{ color: "#8C7A94", fontSize: 11, marginBottom: 4 }}>Cadeaux envoyés au total</p>
            <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 22, fontWeight: 600, margin: 0 }}>{revenue.giftsSentCount}</p>
          </div>
        </div>
      )}
      {error && <p style={{ color: "#FF6B5B", fontSize: 12.5, marginBottom: 12 }}>{error}</p>}
      {loading && <p style={{ color: "#B39FBF" }}>Chargement...</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, marginBottom: 24 }}>
        {gifts.map((g) => (
          <div key={g.id} style={{ background: "#2A1B33", borderRadius: 14, padding: 16, opacity: g.active ? 1 : 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <input
                value={g.icon} onChange={(e) => updateGift(g.id, { icon: e.target.value })}
                style={{ width: 44, textAlign: "center", fontSize: 20, padding: "6px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#FBEFE9" }}
              />
              <input
                value={g.name} onChange={(e) => updateGift(g.id, { name: e.target.value })}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#FBEFE9", fontSize: 13.5 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Coins size={14} color="#F2B84B" />
              <input
                type="number" value={g.price_coins}
                onChange={(e) => updateGift(g.id, { price_coins: e.target.value })}
                style={{ width: 80, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#FBEFE9", fontSize: 13 }}
              />
              <span style={{ color: "#8C7A94", fontSize: 12 }}>Coins</span>
            </div>
            <button onClick={() => updateGift(g.id, { active: g.active ? 0 : 1 })} style={{
              width: "100%", padding: "7px 0", borderRadius: 8, cursor: "pointer", fontSize: 12,
              background: g.active ? "rgba(255,107,91,0.15)" : "rgba(79,168,255,0.15)",
              color: g.active ? "#FF6B5B" : "#A78BFA",
              border: `1px solid ${g.active ? "rgba(255,107,91,0.35)" : "rgba(79,168,255,0.4)"}`,
            }}>{g.active ? "Désactiver" : "Réactiver"}</button>
          </div>
        ))}
      </div>

      <div style={{ background: "#2A1B33", borderRadius: 14, padding: 16, maxWidth: 420 }}>
        <p style={{ color: "#FBEFE9", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Ajouter un nouveau cadeau</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            placeholder="🎁" value={newGift.icon} onChange={(e) => setNewGift((n) => ({ ...n, icon: e.target.value }))}
            style={{ width: 50, textAlign: "center", padding: "8px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#FBEFE9" }}
          />
          <input
            placeholder="Nom du cadeau" value={newGift.name} onChange={(e) => setNewGift((n) => ({ ...n, name: e.target.value }))}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#FBEFE9", fontSize: 13.5 }}
          />
          <input
            type="number" placeholder="Prix" value={newGift.priceCoins} onChange={(e) => setNewGift((n) => ({ ...n, priceCoins: e.target.value }))}
            style={{ width: 80, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#FBEFE9", fontSize: 13.5 }}
          />
        </div>
        <button onClick={createGift} disabled={creating} style={{
          width: "100%", padding: "10px 0", borderRadius: 10, cursor: creating ? "default" : "pointer",
          background: "#FF6B5B", color: "#FBEFE9", border: "none", fontWeight: 600, fontSize: 13, opacity: creating ? 0.7 : 1,
        }}>{creating ? "Création..." : "Ajouter à la boutique"}</button>
      </div>
    </div>
  );
}

function ModerationAdminSection({ adminKey }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/posts/pending`, { headers: { "x-admin-key": adminKey } });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setError("Impossible de charger les publications en attente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (postId, decision) => {
    setPosts((p) => p.filter((x) => x.id !== postId));
    try {
      await fetch(`${API_BASE}/api/admin/posts/${postId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ decision }),
      });
    } catch {
      setError("Une décision n'a pas pu être enregistrée. Réessaie.");
    }
  };

  return (
    <div>
      <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 24, marginBottom: 6 }}>
        Publications en attente ({posts.length})
      </p>
      <p style={{ color: "#8C7A94", fontSize: 12.5, marginBottom: 20 }}>
        Chaque photo/vidéo publiée doit être validée ici avant d'apparaître sur le profil de son auteur.
      </p>
      {error && <p style={{ color: "#FF6B5B", fontSize: 12.5, marginBottom: 12 }}>{error}</p>}
      {loading && <p style={{ color: "#B39FBF" }}>Chargement...</p>}
      {!loading && posts.length === 0 && <p style={{ color: "#B39FBF" }}>Rien à modérer pour le moment 👍</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {posts.map((p) => (
          <div key={p.id} style={{ background: "#2A1B33", borderRadius: 14, padding: 12 }}>
            <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 10, overflow: "hidden", marginBottom: 10, background: "#000" }}>
              {p.media_type === "video" ? (
                <video src={p.media_url} controls playsInline preload="metadata" poster={getVideoThumbnail(p.media_url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <img src={p.media_url} alt="À modérer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <p style={{ color: "#FBEFE9", fontSize: 12.5, marginBottom: 10 }}>{p.author_name} <span style={{ color: "#8C7A94" }}>({p.author_email})</span></p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => decide(p.id, "rejected")} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer",
                background: "rgba(255,107,91,0.15)", color: "#FF6B5B", border: "1px solid rgba(255,107,91,0.35)", fontSize: 12.5,
              }}>Refuser</button>
              <button onClick={() => decide(p.id, "approved")} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer",
                background: "rgba(79,168,255,0.15)", color: "#A78BFA", border: "1px solid rgba(79,168,255,0.4)", fontSize: 12.5,
              }}>Approuver</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminScreen() {
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("verifications");

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
          <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 20, marginBottom: 16 }}>Accès administrateur</p>
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
    <div style={{
      minHeight: "100vh", padding: 24, fontFamily: "Inter, sans-serif",
      background: "radial-gradient(1200px 700px at 15% -10%, rgba(139,92,246,0.14), transparent 60%), radial-gradient(1000px 600px at 90% 10%, rgba(232,84,138,0.1), transparent 55%), #0A0611",
    }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <button onClick={() => setTab("verifications")} style={{
          padding: "9px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontFamily: "Manrope, sans-serif", fontWeight: 700,
          background: tab === "verifications" ? "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)" : "rgba(255,255,255,0.06)",
          color: tab === "verifications" ? "#2A0E12" : "#FBEFE9", border: "1px solid rgba(255,255,255,0.12)",
        }}>Vérifications</button>
        <button onClick={() => setTab("gifts")} style={{
          padding: "9px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontFamily: "Manrope, sans-serif", fontWeight: 700,
          background: tab === "gifts" ? "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)" : "rgba(255,255,255,0.06)",
          color: tab === "gifts" ? "#2A0E12" : "#FBEFE9", border: "1px solid rgba(255,255,255,0.12)",
        }}>Boutique de cadeaux</button>
        <button onClick={() => setTab("moderation")} style={{
          padding: "9px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontFamily: "Manrope, sans-serif", fontWeight: 700,
          background: tab === "moderation" ? "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)" : "rgba(255,255,255,0.06)",
          color: tab === "moderation" ? "#2A0E12" : "#FBEFE9", border: "1px solid rgba(255,255,255,0.12)",
        }}>Modération</button>
      </div>

      {tab === "gifts" ? (
        <GiftsAdminSection adminKey={adminKey} />
      ) : tab === "moderation" ? (
        <ModerationAdminSection adminKey={adminKey} />
      ) : (
        <>
      <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 24, marginBottom: 20 }}>
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
                background: "rgba(79,168,255,0.15)", color: "#A78BFA", border: "1px solid rgba(79,168,255,0.4)", fontSize: 13,
              }}>Valider</button>
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}

function MainApp() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(!!API_BASE);
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try { return localStorage.getItem("lovinia_onboarding_seen") === "true"; } catch { return false; }
  });
  const [tab, setTab] = useState("discover");
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeChat, setActiveChat] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
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
    setViewingProfile(null);
    if (API_BASE) {
      setActiveChat(conv); // conv vient déjà du backend avec matchId, name, img
    } else {
      const full = conversations.find((c) => c.id === conv.id) || conv;
      setActiveChat(full);
    }
  };

  const openProfile = (matchOrConv) => setViewingProfile(matchOrConv);

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
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
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
      ) : !user && !onboardingDone ? (
        <OnboardingScreens onDone={() => {
          try { localStorage.setItem("lovinia_onboarding_seen", "true"); } catch {}
          setOnboardingDone(true);
        }} />
      ) : !user ? (
        <AuthScreen onAuth={setUser} />
      ) : viewingProfile ? (
        <ProfileDetailScreen match={viewingProfile} currentUserId={user?.id} onBack={() => setViewingProfile(null)} onMessage={() => openChat(viewingProfile)} />
      ) : activeChat ? (
        <ChatScreen conversation={activeChat} currentUserId={user?.id} onBack={() => setActiveChat(null)} onSend={sendMessage} onViewProfile={openProfile} />
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {tab === "discover" && <DiscoverScreen onNewMatch={handleNewMatch} />}
            {tab === "matches" && <MatchesScreen matches={matches} onOpenChat={openChat} onViewProfile={openProfile} />}
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
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 32%, rgba(232,84,138,0.28), rgba(10,6,17,0.95) 62%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 50, gap: 14,
        }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%", padding: 3,
            background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)",
          }}>
            <img src={matchToast.img} alt={matchToast.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "3px solid #0A0611" }} />
          </div>
          <span style={{
            fontFamily: "Manrope, sans-serif", fontSize: 28, fontWeight: 800,
            background: "linear-gradient(120deg, #FF6B5B 0%, #E8548A 55%, #9B5DE5 100%)",
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          }}>C'est un match !</span>
          <span style={{ color: "#C6B4C9", fontSize: 13.5 }}>Toi et {matchToast.name}, vous vous êtes likés</span>
        </div>
      )}
    </div>
  );
}

function VerifyEmailScreen() {
  const [status, setStatus] = useState("checking"); // "checking" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token || !API_BASE) {
      setStatus("error");
      setMessage("Lien invalide.");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Lien invalide ou déjà utilisé.");
        setStatus("success");
      } catch (e) {
        setStatus("error");
        setMessage(e.message || "Lien invalide ou déjà utilisé.");
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#1B1223", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 360 }}>
        {status === "checking" && <p style={{ color: "#B39FBF", fontSize: 15 }}>Confirmation en cours...</p>}
        {status === "success" && (
          <>
            <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
            <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Email confirmé !</p>
            <p style={{ color: "#D8C4D0", fontSize: 13.5, marginBottom: 20 }}>Ton compte Lovinia est maintenant pleinement activé.</p>
            <a href="/" style={{ display: "inline-block", background: "#FF6B5B", color: "#FBEFE9", padding: "12px 24px", borderRadius: 14, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              Retourner sur Lovinia
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
            <p style={{ color: "#FBEFE9", fontFamily: "Manrope, sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Lien invalide</p>
            <p style={{ color: "#D8C4D0", fontSize: 13.5, marginBottom: 20 }}>{message} Tu peux redemander un email de confirmation depuis ton profil.</p>
            <a href="/" style={{ display: "inline-block", background: "rgba(255,255,255,0.08)", color: "#FBEFE9", padding: "12px 24px", borderRadius: 14, textDecoration: "none", fontSize: 14 }}>
              Retourner sur Lovinia
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function DatingAppMVP() {
  const isAdminRoute = typeof window !== "undefined" && window.location.search.includes("admin=true");
  const isVerifyRoute = typeof window !== "undefined" && window.location.pathname.includes("verify-email");
  const isLegalRoute = typeof window !== "undefined" && window.location.pathname.includes("legal");
  if (isLegalRoute) return <PublicLegalScreen />;
  if (isVerifyRoute) return <VerifyEmailScreen />;
  return isAdminRoute ? <AdminScreen /> : <MainApp />;
}
