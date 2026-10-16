import React from 'react'
import { useState, useEffect } from "react";

const PWAInstallPrompt = () => {
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault(); // block auto-prompt
            setDeferredPrompt(e);
            setShowInstallButton(true); // show custom "Install" button
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                console.log("User accepted the install prompt");
            } else {
                console.log("User dismissed the install prompt");
            }
            setDeferredPrompt(null);
            setShowInstallButton(false);
        }
    };
    return (
    <button onClick={handleInstallClick} className='px-4 py-2 rounded-xl bg-[var(--theme-accent-bg)] text-[var(--theme-accent-fg)] text-sm font-bold shadow-md hover:opacity-90 transition cursor-pointer'>Install this App</button>
    )
}

export default PWAInstallPrompt