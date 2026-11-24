"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, HeartHandshake, Sparkles } from "lucide-react";

const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });
const GradientASCII = dynamic(() => import("./GradientASCII"), { ssr: false });

const team = [
  { name: "Abbas Ali", image: "/team/abbas-ali.png" },
  { name: "Mayank Dhingra", image: "/team/mayank-dhingra.png" },
  { name: "Das Gajraj Sharma", image: "/team/das-gajraj-sharma.png" },
  { name: "Sammnyu Joshii", image: "/team/sammnyu-joshii.png" },
];

export function SupportPage() {
  return (
    <main className="support-page ca-canvas-container">
      <div className="support-background" aria-hidden="true">
        <GradientASCII
          colors={["#1e3fd8", "#f6f8ff", "#a5d8ff", "#38bdf8"]}
          shape="horizon"
          characters=" =+xX0S8#@"
          cellSize={18}
          density={0.8}
          glyphOpacity={0.85}
          glow={0.2}
          depthOfField={0}
          flicker={0.2}
          softness={0.5}
          scale={1}
          flow={0.5}
          speed={1}
          gradientOpacity={0.9}
          grain={0.08}
          variation={0}
          mouseInteraction
          scrambleRadius={0.1}
          clickEffect="wave"
          intro
          lightMode={false}
        />
      </div>
      <div className="support-page-inner">
        <Link className="support-back-link" href="/dashboard">
          <ArrowLeft size={16} />
          Back to Studio
        </Link>

        <section className="support-team-section" aria-labelledby="team-heading">
          <div className="support-section-heading">
            <div>
              <span className="support-eyebrow">Meet the team</span>
              <h2 id="team-heading">The developers behind your studio.</h2>
            </div>
            <p>Drag a card to explore it.</p>
          </div>

          <div className="support-team-grid">
            {team.map((member) => (
              <article className="support-team-member" key={member.name}>
                <div className="support-lanyard">
                  <Lanyard
                    frontImage={member.image}
                    backImage={member.image}
                    strapColor="#111827"
                    cardColor="#ffffff"
                    imageFit="cover"
                    orientation="portrait"
                    finish="glossy"
                    cornerRadius={0.3}
                    size={0.62}
                    anchor="center"
                    strapLength={0.48}
                    strapWidth={0.65}
                    metal="silver"
                    gravity={0.75}
                    damping={0.22}
                    elasticity={0.68}
                    breeze={0.9}
                    interactive
                    intro
                  />
                </div>
                <div className="support-team-meta">
                  <strong>@{member.name}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="support-hero">
          <div className="support-hero-copy">
            <span className="support-eyebrow">
              <HeartHandshake size={16} />
              Built by a small team
            </span>
            <h1>Support the people building ShortsYou.</h1>
            <p>
              Your contribution helps Abbas, Mayank, Das, and Sammnyu keep
              improving the tools that turn ideas into momentum.
            </p>
            <div className="support-cta">
              <Sparkles size={16} />
              Every bit of support helps us build more.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
