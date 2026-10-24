"use client";
import React from "react";
import Fullscreen from "./fullscreen";

/* Examples of using <Fullscreen> with different content.
 * The wrapper doesn't know what's inside, so anything that should
 * fill the screen just needs to use height: 100% / width: 100%.
 */

// Example 1: a video player
export function VideoExample() {
  return (
    <Fullscreen
      controls={({ active, toggle }) => (
        <>
          <span style={{ color: "white" }}>My Video</span>
          <button onClick={toggle}>{active ? "Exit" : "Full screen"}</button>
        </>
      )}
    >
      <video
        src="/video.mp4"
        controls
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </Fullscreen>
  );
}

// Example 2: a photo gallery that changes its layout when fullscreen
export function GalleryExample({ photos }: { photos: string[] }) {
  return (
    <Fullscreen
      hideControlsAfter={2000}
      onChange={(active) => console.log("fullscreen:", active)}
      controls={({ toggle, active }) => (
        <button onClick={toggle}>{active ? "Close" : "View fullscreen"}</button>
      )}
    >
      {({ active }) => (
        <div
          style={{
            display: "grid",
            gap: "0.8rem",
            height: "100%",
            overflowY: "auto",
            gridTemplateColumns: active
              ? "repeat(4, 1fr)"
              : "repeat(2, 1fr)",
          }}
        >
          {photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              style={{ width: "100%", objectFit: "cover" }}
            />
          ))}
        </div>
      )}
    </Fullscreen>
  );
}
