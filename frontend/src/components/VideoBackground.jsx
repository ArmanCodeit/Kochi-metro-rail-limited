import React, { useEffect, useState } from 'react';
import '../styles/VideoBackground.css';

export default function VideoBackground({ src = '/images/200(1).mp4', poster = '/images/200(1).gif', overlayOpacity = 0.28 }) {
    // overlayOpacity: 0..1 - controls darkness for text readability
    const overlayStyle = {
        background: `linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,${overlayOpacity}))`
    };

    const defaultPoster = '/images/200(1).gif';
    const [resolvedPoster, setResolvedPoster] = useState(poster || defaultPoster);

    useEffect(() => {
        let mounted = true;
        const img = new Image();
        img.onload = () => {
            if (mounted) setResolvedPoster(poster);
        };
        img.onerror = () => {
            if (mounted) setResolvedPoster(defaultPoster);
        };
        // try loading provided poster
        img.src = poster || defaultPoster;
        return () => { mounted = false; };
    }, [poster]);

    return (
        <div className="video-bg-wrapper" aria-hidden>
            <video
                className="video-bg"
                src={src}
                poster={resolvedPoster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
            />
            <div className="video-overlay" style={overlayStyle} />
        </div>
    );
}
