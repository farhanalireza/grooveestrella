// src/Components/Footer.jsx
import { useRouter } from "next/navigation";

export default function Footer() {
    const router = useRouter();

    return (
        <footer className="md:pb-42 pb-50 px-6 pt-6 text-center text-[13px] text-gray-400 bg-black/70 backdrop-blur-md border-t border-white/10 w-full z-40">
            <div className="space-y-2 max-w-3xl mx-auto">
                <p>
                    © 2025{" "}
                    <span
                        className="text-white font-semibold hover:text-green-400 transition cursor-pointer"
                        onClick={() => router.push("/redirect?page=the-code-breakers")}
                    >
                        The Code Breakers
                    </span>{" "}
                    — Crafted with <span className="text-red-500">♥</span> for visionaries who love music & code.
                </p>

                <p>
                    Built by{" "}
                    <span
                        className="text-green-400 underline hover:text-green-300 cursor-pointer transition"
                        onClick={() => router.push("/redirect?page=the-code-breakers")}
                    >
                        The Code Breakers
                    </span>{" "}
                    &{" "}
                    <span
                        className="text-blue-400 underline hover:text-blue-300 cursor-pointer transition"
                        onClick={() => router.push("/credits")}
                    >
                        our team
                    </span>{" "}
                    — MIT Licensed.
                </p>

                <p className="italic text-gray-500">
                    Inspired by the rhythm of sound and the elegance of software.
                </p>

                <p>
                    Full team credits{" "}
                    <span
                        className="text-red-500 underline hover:text-red-400 cursor-pointer"
                        onClick={() => router.push("/credits")}
                    >
                        here
                    </span>
                    .
                </p>

                <div className="flex justify-center items-center gap-4">
                    <p className="text-red-500 underline hover:text-red-400 cursor-pointer active:text-red-100 transition-all duration-200"
                        onClick={() => router.push("/privacy")}
                    >
                        Privacy Policy
                    </p>
                    <p className="text-red-500 underline hover:text-red-400 cursor-pointer active:text-red-100 transition-all duration-200"
                        onClick={() => router.push("/terms")}
                    >
                        Terms and Conditions
                    </p>
                </div>

                {/* MusicBrainz Attribution */}
                <div className="flex justify-center items-center gap-2 pt-4 opacity-75">
                    <span className="text-xs text-gray-400">Metadata powered by</span>
                    <a
                        href="https://musicbrainz.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#60A5FA] hover:text-[#93c5fd] transition flex items-center gap-1.5"
                    >
                        <span>MusicBrainz & Cover Art Archive</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
