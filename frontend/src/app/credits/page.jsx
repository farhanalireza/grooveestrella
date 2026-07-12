// src/app/credits/page.jsx
"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CreditsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <motion.div
      className="min-h-screen bg-[#07090F] text-[#F4F7FF] flex flex-col justify-center items-center p-6 space-grotesk"
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#60A5FA] via-[#2563EB] to-[#60A5FA]">
        Credits & Acknowledgements
      </h1>

      <p className="text-[#8992A5] text-md text-center max-w-2xl mb-10">
        This application was meticulously crafted with passion, dedication, and teamwork. We acknowledge the remarkable individuals who contributed to its success.
      </p>

      <div className="w-full max-w-2xl space-y-6 text-sm md:text-base">
        <section className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-[#2563EB]/15">
          <h2 className="text-xl font-semibold text-[#60A5FA] mb-1">Lead Developer & Designer</h2>
          <p><span className="font-semibold text-[#F4F7FF]">Farhan Ali Reza</span> — Frontend, UI/UX, partial backend, project vision & architecture.</p>
        </section>

        <section className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-[#2563EB]/15">
          <h2 className="text-xl font-semibold text-[#60A5FA] mb-1">Backend Development</h2>
          <p><span className="font-semibold text-[#F4F7FF]">Soumodip Mondal</span> — Core backend systems, authentication, and API integrations.</p>
        </section>

        <section className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-[#2563EB]/15">
          <h2 className="text-xl font-semibold text-[#60A5FA] mb-1">Database Engineering</h2>
          <p><span className="font-semibold text-[#F4F7FF]">Soumodip Mondal & Dhiraj Patra</span> — Database schema, optimization, and management.</p>
        </section>

        <section className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-[#2563EB]/15">
          <h2 className="text-xl font-semibold text-[#60A5FA] mb-1">Data Collection & Research</h2>
          <p><span className="font-semibold text-[#F4F7FF]">Yeasir Maruf Mollah & Mouktick Manna</span> — Data gathering, surveys, and dataset preparation.</p>
        </section>

        <section className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-[#2563EB]/15">
          <h2 className="text-xl font-semibold text-[#60A5FA] mb-1">Presentations & Documentation</h2>
          <p><span className="font-semibold text-[#F4F7FF]">Moucktick Manna & Team</span> — Project reports, slides, and demonstrations.</p>
        </section>

        <section className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-[#2563EB]/15">
          <h2 className="text-xl font-semibold text-[#8992A5] mb-1">Special Thanks</h2>
          <p>To all testers, supporters, mentors, and the developer community who inspired and guided us throughout this journey. We extend heartfelt thanks to all the anonymous participants who contributed their time and insights to our surveys and research. Your input was invaluable in shaping this app.</p>
        </section>
      </div>

      <p className="text-xs text-[#8992A5]/70 mt-12 text-center max-w-md">
        © 2026 The CodeBreakers. This app is licensed under the MIT License. All trademarks and logos are property of their respective owners.
      </p>
    </motion.div>
  );
}
