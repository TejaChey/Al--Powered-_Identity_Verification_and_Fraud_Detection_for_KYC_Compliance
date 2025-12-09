// src/components/DeviceFingerprint.jsx
// Device Fingerprinting component - Captures browser/OS/IP info for fraud analytics
import React, { useEffect, useState } from "react";
import { Monitor, Globe, Clock, Cpu, MapPin, Fingerprint } from "lucide-react";

/**
 * Collects device fingerprint information for fraud detection
 * Returns: { browser, os, platform, language, timezone, screenRes, touchSupport, timestamp }
 */
export function collectDeviceFingerprint() {
    const ua = navigator.userAgent;

    // Detect browser
    let browser = "Unknown";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

    // Detect OS
    let os = "Unknown";
    if (ua.includes("Windows NT 10")) os = "Windows 10/11";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    // Collect fingerprint data
    const fingerprint = {
        browser,
        browserVersion: ua.match(/(?:Chrome|Firefox|Safari|Edge|OPR)\/(\d+)/)?.[1] || "Unknown",
        os,
        platform: navigator.platform || "Unknown",
        language: navigator.language || "Unknown",
        languages: navigator.languages?.join(", ") || navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenRes: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
        touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack === "1",
        hardwareConcurrency: navigator.hardwareConcurrency || "Unknown",
        deviceMemory: navigator.deviceMemory || "Unknown",
        timestamp: new Date().toISOString(),
        localTime: new Date().toLocaleString(),
    };

    // Generate a simple hash for device identification
    const hashString = `${fingerprint.browser}|${fingerprint.os}|${fingerprint.screenRes}|${fingerprint.timezone}|${fingerprint.language}`;
    fingerprint.deviceHash = btoa(hashString).substring(0, 16);

    return fingerprint;
}

/**
 * DeviceFingerprint Display Component
 * Shows device information in a clean UI format
 */
export default function DeviceFingerprint({ fingerprint = null, compact = false }) {
    const [fp, setFp] = useState(fingerprint);

    useEffect(() => {
        if (!fingerprint) {
            setFp(collectDeviceFingerprint());
        }
    }, [fingerprint]);

    if (!fp) return null;

    if (compact) {
        return (
            <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> {fp.browser} on {fp.os}
                </span>
                <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {fp.timezone}
                </span>
                <span className="flex items-center gap-1">
                    <Fingerprint className="w-3 h-3" /> {fp.deviceHash}
                </span>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-xl p-5">
            <h4 className="text-sm font-bold text-cyan-300 mb-4 flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Device Fingerprint
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <div className="text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> Browser
                    </div>
                    <div className="text-white font-mono">{fp.browser} {fp.browserVersion}</div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <div className="text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> OS
                    </div>
                    <div className="text-white font-mono">{fp.os}</div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <div className="text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Timezone
                    </div>
                    <div className="text-white font-mono">{fp.timezone}</div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <div className="text-slate-500 uppercase tracking-wider mb-1">Screen</div>
                    <div className="text-white font-mono">{fp.screenRes}</div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <div className="text-slate-500 uppercase tracking-wider mb-1">Language</div>
                    <div className="text-white font-mono">{fp.language}</div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <div className="text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Timestamp
                    </div>
                    <div className="text-white font-mono text-[10px]">{fp.localTime}</div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5 col-span-2 md:col-span-3">
                    <div className="text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Fingerprint className="w-3 h-3" /> Device Hash
                    </div>
                    <div className="text-cyan-400 font-mono">{fp.deviceHash}</div>
                </div>
            </div>

            {/* Risk Indicators */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-slate-400">
                    <span className="font-bold text-slate-300">Risk Indicators:</span>
                    <ul className="mt-2 space-y-1">
                        {fp.doNotTrack && (
                            <li className="flex items-center gap-2 text-amber-400">
                                <span>⚠</span> Do Not Track enabled (privacy mode)
                            </li>
                        )}
                        {fp.touchSupport && fp.os !== "Android" && fp.os !== "iOS" && (
                            <li className="flex items-center gap-2 text-blue-400">
                                <span>ℹ</span> Touch device detected on desktop OS
                            </li>
                        )}
                        {!fp.cookiesEnabled && (
                            <li className="flex items-center gap-2 text-rose-400">
                                <span>⚠</span> Cookies disabled
                            </li>
                        )}
                        {fp.hardwareConcurrency && fp.hardwareConcurrency < 2 && (
                            <li className="flex items-center gap-2 text-amber-400">
                                <span>⚠</span> Low CPU cores (possible VM)
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
