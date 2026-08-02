import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";
import {fontFamily} from "../fonts";

export type StockPopupCardProps = {
  companyName: string;
  ticker: string;
  description: string;
  logoFile: string;
  brandColor?: string;
};

export const StockPopupCard: React.FC<StockPopupCardProps> = ({
  companyName,
  ticker,
  description,
  logoFile,
  brandColor = "#76B900",
}) => {
  const companyFontSize =
    companyName.length <= 10
      ? 88
      : companyName.length <= 16
        ? 76
        : companyName.length <= 22
          ? 64
          : 56;
  const descriptionFontSize = Math.max(
    27,
    Math.min(50, Math.floor(840 / Math.max(description.length, 1))),
  );
  const rgb = brandColor
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((part) => Number.parseInt(part, 16));
  const luminance = rgb
    ? (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
    : 0;
  const tickerTextColor = luminance > 0.58 ? "#151715" : "#FFFFFF";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          width: 1360,
          height: 540,
          display: "grid",
          gridTemplateColumns: "390px 1fr",
          backgroundColor: "#FAFAF7",
          border: `7px solid ${brandColor}`,
          borderRadius: 46,
          boxShadow: "0 24px 55px rgba(0,0,0,0.32)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 58,
            borderRight: "4px solid #D9DDD5",
          }}
        >
          <Img
            src={staticFile(logoFile)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 58px",
          }}
        >
          <div
            style={{
              color: "#151715",
              fontSize: companyFontSize,
              lineHeight: 1.05,
              fontWeight: 900,
              whiteSpace: "nowrap",
              marginBottom: 30,
            }}
          >
            {companyName}
          </div>

          <div
            style={{
              alignSelf: "flex-start",
              minWidth: 270,
              padding: "11px 34px 15px",
              backgroundColor: brandColor,
              borderRadius: 24,
              color: tickerTextColor,
              fontSize: 68,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: 2,
              textAlign: "center",
              marginBottom: 44,
            }}
          >
            {ticker}
          </div>

          <div
            style={{
              color: "#202320",
              fontSize: descriptionFontSize,
              lineHeight: 1.25,
              fontWeight: 800,
              maxWidth: 840,
              whiteSpace: "nowrap",
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
