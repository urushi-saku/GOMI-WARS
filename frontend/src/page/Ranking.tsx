import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRanking, type RankingEntry } from "../utils/rankingApi";

/** photoURL が安全な https:// URL かを確認 */
function isSafeUrl(url: string): boolean {
  return url.startsWith("https://");
}

/** ユーザーアイコン（photoURL があれば画像、なければデフォルトSVG） */
function UserAvatar({ entry }: { entry: RankingEntry }) {
  if (entry.photoURL && isSafeUrl(entry.photoURL)) {
    return (
      <img
        src={entry.photoURL}
        alt={entry.displayName || "ユーザーアイコン"}
        width={32}
        height={32}
        referrerPolicy="no-referrer"
        data-avatar
      />
    );
  }
  return (
    <img
      src="/default-avatar.svg"
      alt={entry.displayName || "デフォルトアイコン"}
      width={32}
      height={32}
      data-avatar
    />
  );
}

/** ランクバッジ（1〜3位はメダル絵文字、4位以降は番号） */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span data-rank="1">🥇</span>;
  if (rank === 2) return <span data-rank="2">🥈</span>;
  if (rank === 3) return <span data-rank="3">🥉</span>;
  return <span data-rank="other">#{rank}</span>;
}

/** 1件分の行 */
function RankRow({ entry, isMe }: { entry: RankingEntry; isMe: boolean }) {
  return (
    <li data-me={isMe || undefined}>
      <RankBadge rank={entry.rank} />
      <UserAvatar entry={entry} />
      <span data-name>{entry.displayName}</span>
      <span data-point>エントロピー削減量: {entry.totalPoint.toLocaleString()}</span>
    </li>
  );
}

export default function Ranking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myEntry, setMyEntry] = useState<RankingEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRanking(20)
      .then((res) => {
        setRanking(res.ranking);
        setMyRank(res.myRank);
        setMyEntry(res.myEntry);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // 自分がトップ20圏内かどうか
  const myUid = myEntry?.uid;
  const myEntryInList = myUid ? ranking.some((e) => e.uid === myUid) : false;
  // 圏外のときだけ sticky バーを表示
  const showStickyBar = !loading && !error && myEntry !== null && !myEntryInList;

  return (
    <div data-page="ranking">
      <header data-ranking-header>
        <h1 data-text="RANKING">RANKING</h1>
        <p>// GLOBAL LEADERBOARD</p>
      </header>

      <div data-ranking-panel>
        <div data-panel-header>
          <span>TOP AGENTS</span>
          {myRank !== null && (
            <span data-my-rank-badge>第 {myRank} 位</span>
          )}
        </div>

        {loading && <div data-status="loading">LOADING DATA...</div>}
        {error && <div data-status="error">ERROR: {error}</div>}
        {!loading && !error && ranking.length === 0 && (
          <div data-status="empty">NO DATA FOUND</div>
        )}

        {!loading && !error && ranking.length > 0 && (
          <ol data-ranking-list>
            {ranking.map((entry) => (
              <RankRow
                key={entry.uid}
                entry={entry}
                isMe={entry.uid === myUid}
              />
            ))}
          </ol>
        )}

        <div data-panel-footer>
          <Link to="/">[ &lt; BACK TO HOME ]</Link>
        </div>
      </div>

      {/* 圏外ユーザーの順位を画面下部に固定表示 */}
      {showStickyBar && myEntry && (
        <div data-sticky-my-rank>
          <RankBadge rank={myEntry.rank} />
          <UserAvatar entry={myEntry} />
          <span data-name>{myEntry.displayName}</span>
          <span data-point>エントロピー削減量: {myEntry.totalPoint.toLocaleString()}</span>
          <span data-my-label>← YOU</span>
        </div>
      )}
    </div>
  );
}

