import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { saveInitialProfile } from "../utils/authUtils";
import type { UserProfile, Pickup } from "../types";
import styles from "./Profile.module.css";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // 編集モード
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(false);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        setFetchError(true);
        return;
      }
      const raw = snap.data();
      const data: UserProfile = {
        ...(raw as UserProfile),
        totalPoint: raw["totalPoint"] ?? raw["totalPoints"] ?? 0,
        totalPickups: raw["totalPickups"] ?? 0,
      };
      setProfile(data);
      setEditName(data.displayName);

      const q = query(
        collection(db, "pickups"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const pickupSnap = await getDocs(q);
      setPickups(
        pickupSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Pickup))
      );
    } catch (err) {
      console.error("Profile fetchData error:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 編集開始 */
  const handleEditStart = () => {
    setEditName(profile?.displayName ?? "");
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setNameError(null);
    setIsEditing(true);
  };

  /** 編集キャンセル */
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setNameError(null);
  };

  /** アバター画像選択 */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
  };

  /** 編集保存 */
  const handleSave = async () => {
    if (!user) return;

    if (editName.trim() === "") {
      setNameError("ユーザー名を入力してください。");
      return;
    }
    if (/[\s\u3000]/.test(editName)) {
      setNameError("ユーザー名にスペースは使用できません。");
      return;
    }

    setSaving(true);
    setNameError(null);
    try {
      await saveInitialProfile(user, editName.trim(), editPhotoFile);
      // 保存後にプロフィールを再取得して最新状態を反映
      await fetchData();
      setIsEditing(false);
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
    } catch {
      setNameError("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>LOADING...</div>;
  }

  if (fetchError || !profile) {
    return (
      <div className={styles.loading}>
        <p>ERROR: プロフィールデータを取得できませんでした。</p>
        <button type="button" onClick={fetchData}>
          再読み込み
        </button>
      </div>
    );
  }

  const avatarSrc = editPhotoPreview ?? profile.photoURL ?? "/default-avatar.svg";

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backButton}>
          &lt; BACK
        </button>
        <h1 className={styles.title}>AGENT PROFILE</h1>
      </header>

      {isEditing ? (
        /* ===== 編集モード ===== */
        <section className={styles.editSection}>
          {/* アバター編集 */}
          <div className={styles.avatarEditArea}>
            <img
              src={avatarSrc}
              alt="アバタープレビュー"
              className={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              className={styles.photoChangeButton}
              onClick={() => fileInputRef.current?.click()}
            >
              CHANGE AVATAR
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
          </div>

          {/* ユーザー名編集 */}
          <label className={styles.inputLabel} htmlFor="agent-name">
            AGENT NAME
          </label>
          <div className={styles.inputRow}>
            <input
              id="agent-name"
              className={styles.input}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={20}
              minLength={1}
              autoFocus
            />
          </div>
          {nameError && <p className={styles.error}>{nameError}</p>}

          {/* 操作ボタン */}
          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleEditCancel}
              disabled={saving}
            >
              CANCEL
            </button>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </section>
      ) : (
        /* ===== 表示モード ===== */
        <>
          {/* アバター */}
          <div className={styles.avatarSection}>
            <img
              src={profile.photoURL ?? "/default-avatar.svg"}
              alt="アバター"
              className={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
            <div className={styles.avatarInfo}>
              <span className={styles.displayNameLabel}>{profile.displayName}</span>
              <button
                type="button"
                className={styles.editButton}
                onClick={handleEditStart}
              >
                EDIT PROFILE
              </button>
            </div>
          </div>

          {/* ステータス */}
          <section className={styles.statusSection}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>TOTAL POINTS</span>
              <span className={styles.statValue}>{profile.totalPoint}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>PICKUPS</span>
              <span className={styles.statValue}>{profile.totalPickups}</span>
            </div>
          </section>

          {/* ゴミ拾い履歴 */}
          <section className={styles.historySection}>
            <h2 className={styles.sectionTitle}>OBSERVATION LOG</h2>
            {pickups.length === 0 ? (
              <p className={styles.emptyMessage}>// 記録なし</p>
            ) : (
              <ul className={styles.pickupList}>
                {pickups.map((p) => (
                  <li key={p.id} className={styles.pickupItem}>
                    {p.imageURL && (
                      <img
                        src={p.imageURL}
                        alt={p.itemName}
                        className={styles.pickupImage}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className={styles.pickupInfo}>
                      <span className={styles.pickupName}>{p.itemName}</span>
                      <span className={styles.pickupPoint}>+{p.point} pts</span>
                      <p className={styles.pickupComment}>{p.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
