"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SOURCE = "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg";
const INTERVAL = 15 * 60 * 1000;

export function SolarObservation() {
  const [version, setVersion] = useState<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    function refresh() {
      setState("loading");
      setVersion(Date.now());
    }
    refresh();
    const timer = window.setInterval(refresh, INTERVAL);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <figure className="solar-observation">
      <div className="solar-frame">
        <div className="solar-orbit" aria-hidden="true" />
        <span className="solar-coordinate" aria-hidden="true">SOL / 19.3 nm</span>
        {version !== null && state !== "error" && (
          <Image
            key={version}
            src={`${SOURCE}?refresh=${version}`}
            alt="NASA SDO가 193Å 극자외선으로 관측한 태양의 코로나. 관측 강도를 색으로 표현한 이미지입니다."
            width={1024}
            height={1024}
            unoptimized
            loading="eager"
            className={`solar-image ${state === "ready" ? "is-ready" : ""}`}
            onLoad={() => setState("ready")}
            onError={() => setState("error")}
          />
        )}
        {state !== "ready" && (
          <div className="solar-placeholder" role="status">
            <span>{state === "error" ? "태양 이미지를 불러오지 못했어요" : "태양 관측 이미지 연결 중…"}</span>
            {state === "error" && <button onClick={() => { setState("loading"); setVersion(Date.now()); }}>이미지 다시 확인</button>}
          </div>
        )}
      </div>
      <figcaption>
        <div className="solar-caption-title"><span>A GLIMPSE OF THE SUN</span><a href={SOURCE} target="_blank" rel="noreferrer">NASA / SDO · AIA 193Å ↗</a></div>
        <p>최근 관측 사진 · 약 15분 간격 갱신 · 영상 아님</p>
        <p className="solar-disclaimer">관측 시각은 원본 이미지 하단 UTC 표기를 확인하세요. 원천 갱신은 지연될 수 있습니다. 색상은 극자외선 관측을 시각화한 것으로, 눈으로 보는 태양색과 다릅니다.</p>
      </figcaption>
    </figure>
  );
}
