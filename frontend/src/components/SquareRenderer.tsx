import { useEffect, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";

interface SquareData {
  id: string;
  lat: number;
  lng: number;
  size: number; // 一辺の長さ（メートル）
  color: string; // 枠線や塗りつぶしのベースカラー
  description?: string;
}

interface SquareRendererProps {
  squaresData: SquareData[];
}

export default function SquareRenderer({ squaresData }: SquareRendererProps) {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rectangles, setRectangles] = useState<any[]>([]);

  useEffect(() => {
    if (!map) return;

    // 前回の矩形をクリアする
    rectangles.forEach((rect) => rect.setMap(null));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newRectangles: any[] = [];

    squaresData.forEach((data, index) => {
      // 1度あたりの距離の概算（メートル）
      const METERS_PER_DEGREE_LAT = 111111;
      
      const halfSize = data.size / 2;
      
      // 緯度のオフセット
      const latOffset = halfSize / METERS_PER_DEGREE_LAT;
      // 経度のオフセット（緯度によって距離が変わるため cos() で補正）
      const lngOffset = halfSize / (METERS_PER_DEGREE_LAT * Math.cos(data.lat * (Math.PI / 180)));

      // 四角形の境界を計算
      const bounds = {
        north: data.lat + latOffset,
        south: data.lat - latOffset,
        east: data.lng + lngOffset,
        west: data.lng - lngOffset,
      };

      // jsonの順番（index）を利用して、後にあるデータほど zIndex を高くする
      const zIndex = index + 1;

      // google.maps.Rectangleのインスタンスを作成
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rectangle = new (window as any).google.maps.Rectangle({
        bounds,
        strokeColor: data.color, // 指定された色を枠線と塗りに使用
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: data.color,   
        fillOpacity: 1,
        zIndex,                  // 重なり順の制御
        map,
      });

      newRectangles.push(rectangle);
    });

    setRectangles(newRectangles);

    // クリーンアップ関数
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newRectangles.forEach((rect: any) => rect.setMap(null));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, squaresData]);

  return null; // このコンポーネント自体はDOMに何も描画しない
}
