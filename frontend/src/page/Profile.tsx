import { useCallback, useEffect, useState } from "react";
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
import { updateDisplayName } from "../utils/authUtils";
import type { UserProfile, Pickup } from "../types";
import styles from "./Profile.module.css";

export default function Profile() {
  const navigate = useNavigate();
  // PrivateRoute が user の存在を保証しているため non-null アサーションは安全
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [editName, setEditName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

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
      // 旧フィールド totalPoints (複数形) が残っている場合も正しく読み取る
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
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRetry = () => fetchData();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** ユーザー名保存ハンドラ */
  const handleNameSave = async () => {
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
      await updateDisplayName(user, editName.trim());
      setProfile((prev) =>
        prev ? { ...prev, displayName: editName.trim() } : prev
      );
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
        <button type="button" onClick={handleRetry}>
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backButton}>
          &lt; BACK
        </button>
        <h1 className={styles.title}>AGENT PROFILE</h1>
      </header>

      {/* アバター */}
      <div className={styles.avatarSection}>
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt="アバター"
            className={styles.avatarImg}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={styles.avatarPlaceholder}>?</div>
        )}
        <span className={styles.displayNameLabel}>{profile.displayName}</span>
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

      {/* ユーザー名編集 */}
      <section className={styles.editSection}>
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
          />
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleNameSave}
            disabled={saving}
          >
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
        {nameError && <p className={styles.error}>{nameError}</p>}
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
    </div>
  );
}
