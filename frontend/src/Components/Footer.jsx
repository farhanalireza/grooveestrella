// src/Components/Footer.jsx
import { useRouter } from "next/navigation";

export default function Footer() {
    const router = useRouter();

    return (
        <footer className="md:pb-42 pb-50 px-6 pt-6 text-center text-[13px] text-[var(--theme-muted)] bg-[var(--theme-surface)]/90 backdrop-blur-md border-t border-[var(--theme-border)] w-full z-40">
            <div className="space-y-2 max-w-3xl mx-auto">
                <p>
                    © 2025{" "}
                    <span
                        className="text-[var(--theme-fg)] font-semibold hover:text-[var(--theme-accent)] transition cursor-pointer"
                        onClick={() => router.push("/redirect?page=the-code-breakers")}
                    >
                        The Code Breakers
                    </span>{" "}
                    — Crafted with <span className="text-red-500">♥</span> for visionaries who love music & code.
                </p>

                <p>
                    Built by{" "}
                    <span
                        className="text-[var(--theme-accent)] underline hover:opacity-80 cursor-pointer transition"
                        onClick={() => router.push("/redirect?page=the-code-breakers")}
                    >
                        The Code Breakers
                    </span>{" "}
                    &{" "}
                    <span
                        className="text-[var(--theme-accent)] underline hover:opacity-80 cursor-pointer transition"
                        onClick={() => router.push("/credits")}
                    >
                        our team
                    </span>{" "}
                    — MIT Licensed.
                </p>

                <p className="italic text-[var(--theme-muted)]">
                    Inspired by the rhythm of sound and the elegance of software.
                </p>

                <p>
                    Full team credits{" "}
                    <span
                        className="text-[var(--theme-accent)] underline hover:opacity-80 cursor-pointer"
                        onClick={() => router.push("/credits")}
                    >
                        here
                    </span>
                    .
                </p>

                <div className="flex justify-center items-center gap-4">
                    <p className="text-[var(--theme-muted)] underline hover:text-[var(--theme-fg)] cursor-pointer transition-all duration-200"
                        onClick={() => router.push("/privacy")}
                    >
                        Privacy Policy
                    </p>
                    <p className="text-[var(--theme-muted)] underline hover:text-[var(--theme-fg)] cursor-pointer transition-all duration-200"
                        onClick={() => router.push("/terms")}
                    >
                        Terms and Conditions
                    </p>
                </div>

                {/* MusicBrainz Attribution */}
                <div className="flex justify-center items-center gap-2 pt-4 opacity-75">
                    <span className="text-xs text-[var(--theme-muted)]">Metadata powered by</span>
                    <a
                        href="https://musicbrainz.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[var(--theme-accent)] hover:opacity-80 transition flex items-center gap-1.5"
                    >
                        <span>MusicBrainz & Cover Art Archive</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
