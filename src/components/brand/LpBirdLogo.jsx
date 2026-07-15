'use client'

import styles from './LpBirdLogo.module.css'

// Logo LED do pássaro LP (idêntica ao primeiro container da aba Integração).
export default function LpBirdLogo() {
  return (
    <div className={styles.wrap}>
      <div className={styles.bg} />
      <div className={styles.ring} />
      <div className={styles.ringInner} />
      <div className={styles.corner} />
      <div className={styles.corner} />
      <div className={styles.corner} />
      <div className={styles.corner} />
      <div className={styles.glowCenter} />

      <svg className={styles.circuit} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="lpTrailGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M 44 185 H 90 V 135 H 118" stroke="rgba(38,194,129,0.22)" strokeWidth="1.5" />
        <path d="M 44 215 H 90 V 268 H 118" stroke="rgba(38,194,129,0.22)" strokeWidth="1.5" />
        <path d="M 356 148 H 316 V 95  H 284" stroke="rgba(38,194,129,0.22)" strokeWidth="1.5" />
        <path d="M 356 258 H 316 V 312 H 284" stroke="rgba(38,194,129,0.22)" strokeWidth="1.5" />
        <path d="M 198 44  V 90  H 248 V 110" stroke="rgba(38,194,129,0.16)" strokeWidth="1.5" />
        <path d="M 198 356 V 310 H 248 V 292" stroke="rgba(38,194,129,0.16)" strokeWidth="1.5" />
        <circle cx="118" cy="135" r="3.5" fill="rgba(38,194,129,0.45)" />
        <circle cx="118" cy="268" r="3.5" fill="rgba(38,194,129,0.45)" />
        <circle cx="284" cy="95" r="3.5" fill="rgba(38,194,129,0.45)" />
        <circle cx="284" cy="312" r="3.5" fill="rgba(38,194,129,0.45)" />
        <circle cx="248" cy="110" r="3" fill="rgba(38,194,129,0.3)" />
        <circle cx="248" cy="292" r="3" fill="rgba(38,194,129,0.3)" />
        <path className={styles.trail1} d="M 44 185 H 90 V 135 H 118" stroke="#26c281" strokeWidth="2" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="200" filter="url(#lpTrailGlow)" />
        <path className={styles.trail2} d="M 356 148 H 316 V 95 H 284" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="200" filter="url(#lpTrailGlow)" />
        <path className={styles.trail3} d="M 198 356 V 310 H 248 V 292" stroke="#26c281" strokeWidth="2" strokeLinecap="round" strokeDasharray="160" strokeDashoffset="160" filter="url(#lpTrailGlow)" />
      </svg>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assessoria-lp-logo.png" alt="Assessoria LP" className={styles.logoImg} />
    </div>
  )
}
