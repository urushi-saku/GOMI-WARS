export const cyberpunkMapStyles = [
    {
        elementType: "labels",
        stylers: [{ visibility: "off" }],
    },
    {
        elementType: "geometry",
        stylers: [{ color: "#111116" }], // ベースの地面をほとんど黒に近いダークカラーに変更
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ visibility: "off" }],
    },
    {
        featureType: "poi",
        stylers: [{ visibility: "off" }],
    },
    {
        // まず、大枠としての「自然の水域すべて」を確実に青に指定する
        featureType: "water",
        elementType: "geometry.fill",
        stylers: [{ color: "#0a2240" }], // 暗くて深みのあるネイビーブルー
    },
    {
        featureType: "administrative",
        elementType: "geometry.stroke",
        stylers: [
            { visibility: "on" },
            { color: "#00f3ff" },
            { weight: 2 },
        ],
    },
    {
        featureType: "administrative.locality",
        elementType: "geometry.stroke",
        stylers: [
            { visibility: "on" },
            { color: "#ff00ea" },
            { weight: 1.5 },
        ],
    },
    {
        // 郡や区レベルの境界も表示させる
        featureType: "administrative.neighborhood",
        elementType: "geometry.stroke",
        stylers: [
            { visibility: "on" },
            { color: "#ff00ea" },
            { weight: 1.0 },
        ],
    },
];

// 拡大時（市町村レベルが見えるズーム）専用のスタイル
// 県境だけでなく市町村の境界がより太く、明るいネオン調で光るように強調
export const zoomedInCyberpunkMapStyles = [
    // 既存のサイバーパンクベースをすべて適用
    ...cyberpunkMapStyles.filter(style => 
        style.featureType !== "administrative.locality" && 
        style.featureType !== "administrative.neighborhood"
    ),
    
    // 市町村の境界設定だけを上書きして強調
    {
        featureType: "administrative.locality",
        elementType: "geometry.stroke",
        stylers: [
            { visibility: "on" },
            { color: "#ff00ea" },
            { weight: 4.0 }, // ズーム時は線を太くしてネオン感を出す
            { lightness: 30 } // より明るく発光させる
        ],
    },
    {
        featureType: "administrative.neighborhood",
        elementType: "geometry.stroke",
        stylers: [
            { visibility: "on" },
            { color: "#ff00ea" },
            { weight: 2.5 }, 
            { lightness: 30 }
        ],
    },
];
