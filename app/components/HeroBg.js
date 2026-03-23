'use client';
import { useRef } from 'react';
import styles from '../page.module.css';

export default function HeroBg({ children }) {
  const bgRef = useRef(null);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    if (bgRef.current) {
      bgRef.current.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
    }
  }

  function handleMouseLeave() {
    if (bgRef.current) {
      bgRef.current.style.transform = 'translate(0, 0)';
    }
  }

  return (
    <div
      className={styles.heroInteractive}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={bgRef} className={styles.heroBg}>

        {/* Blobs */}
        <div className={styles.heroBlob} style={{width:400,height:400,background:'var(--color-mint-500)',opacity:0.03,top:'10%',left:'5%'}} />
        <div className={styles.heroBlob} style={{width:350,height:350,background:'#378ADD',opacity:0.025,top:'30%',right:'8%'}} />
        <div className={styles.heroBlob} style={{width:300,height:300,background:'#B07CED',opacity:0.02,bottom:'10%',left:'20%'}} />

        {/* Dots */}
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:14,height:14,background:'#E85D50',opacity:0.35,top:'10%',left:'7%',animation:'floatA 4.2s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:10,height:10,background:'#378ADD',opacity:0.3,top:'20%',right:'11%',animation:'floatA 4.8s .6s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:18,height:18,background:'#B07CED',opacity:0.25,top:'55%',left:'4%',animation:'floatA 5.2s 1.2s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:12,height:12,background:'#EF9F27',opacity:0.3,top:'65%',right:'6%',animation:'driftLeft 4.5s .3s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:8,height:8,background:'var(--color-mint-500)',opacity:0.4,top:'33%',left:'14%',animation:'floatA 3.8s .9s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:16,height:16,background:'#D4537E',opacity:0.2,top:'16%',left:'30%',animation:'driftRight 5s 1.5s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:10,height:10,background:'#5DCAA5',opacity:0.28,top:'75%',left:'16%',animation:'floatA 4.3s .4s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:14,height:14,background:'#97C459',opacity:0.22,top:'42%',right:'16%',animation:'driftLeft 4.7s 1.1s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:6,height:6,background:'#85B7EB',opacity:0.35,top:'85%',right:'22%',animation:'floatA 4s .7s ease-in-out infinite'}} />
        <div className={`${styles.fi} ${styles.fiDot}`} style={{width:11,height:11,background:'#E8875C',opacity:0.25,top:'8%',right:'30%',animation:'driftRight 4.6s .2s ease-in-out infinite'}} />

        {/* Feed bars */}
        <div className={`${styles.fi} ${styles.fiBars}`} style={{opacity:0.2,top:'14%',right:'18%',animation:'floatB 5.5s .2s ease-in-out infinite'}}>
          <div className={styles.bar} style={{width:32,background:'var(--color-mint-500)'}} />
          <div className={styles.bar} style={{width:22,background:'var(--text-primary)',opacity:0.4}} />
          <div className={styles.bar} style={{width:26,background:'var(--text-primary)',opacity:0.2}} />
        </div>
        <div className={`${styles.fi} ${styles.fiBars}`} style={{opacity:0.16,top:'62%',right:'12%',animation:'floatC 6s 1s ease-in-out infinite'}}>
          <div className={styles.bar} style={{width:28,background:'#378ADD'}} />
          <div className={styles.bar} style={{width:20,background:'var(--text-primary)',opacity:0.3}} />
          <div className={styles.bar} style={{width:24,background:'var(--text-primary)',opacity:0.15}} />
        </div>
        <div className={`${styles.fi} ${styles.fiBars}`} style={{opacity:0.14,top:'38%',left:'5%',animation:'floatB 5.8s .7s ease-in-out infinite'}}>
          <div className={styles.bar} style={{width:36,background:'#B07CED'}} />
          <div className={styles.bar} style={{width:24,background:'var(--text-primary)',opacity:0.35}} />
          <div className={styles.bar} style={{width:18,background:'var(--text-primary)',opacity:0.18}} />
        </div>

        {/* Play buttons */}
        <svg className={styles.fi} style={{width:22,height:22,opacity:0.25,top:'26%',left:'20%',animation:'floatA 4.6s .5s ease-in-out infinite'}} viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="var(--text-primary)" strokeWidth="1.2" opacity="0.5"/>
          <polygon points="9,6.5 16,11 9,15.5" fill="var(--text-primary)" opacity="0.4"/>
        </svg>
        <svg className={styles.fi} style={{width:18,height:18,opacity:0.2,top:'72%',right:'24%',animation:'driftLeft 5.1s 1.3s ease-in-out infinite'}} viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="var(--color-mint-500)" strokeWidth="1.2" opacity="0.5"/>
          <polygon points="9,6.5 16,11 9,15.5" fill="var(--color-mint-500)" opacity="0.4"/>
        </svg>
        <svg className={styles.fi} style={{width:16,height:16,opacity:0.18,top:'82%',left:'28%',animation:'floatB 4.4s .8s ease-in-out infinite'}} viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="#EF9F27" strokeWidth="1.2" opacity="0.5"/>
          <polygon points="9,6.5 16,11 9,15.5" fill="#EF9F27" opacity="0.4"/>
        </svg>

        {/* Pause buttons */}
        <svg className={styles.fi} style={{width:20,height:20,opacity:0.22,top:'48%',right:'8%',animation:'floatC 5.3s .4s ease-in-out infinite'}} viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="#378ADD" strokeWidth="1.2" opacity="0.5"/>
          <rect x="8" y="7" width="2.5" height="8" rx="0.8" fill="#378ADD" opacity="0.4"/>
          <rect x="12" y="7" width="2.5" height="8" rx="0.8" fill="#378ADD" opacity="0.4"/>
        </svg>
        <svg className={styles.fi} style={{width:16,height:16,opacity:0.18,top:'18%',left:'10%',animation:'driftRight 4.9s 1s ease-in-out infinite'}} viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="#D4537E" strokeWidth="1.2" opacity="0.5"/>
          <rect x="8" y="7" width="2.5" height="8" rx="0.8" fill="#D4537E" opacity="0.4"/>
          <rect x="12" y="7" width="2.5" height="8" rx="0.8" fill="#D4537E" opacity="0.4"/>
        </svg>
        <svg className={styles.fi} style={{width:14,height:14,opacity:0.15,top:'58%',left:'22%',animation:'floatA 5.6s 1.6s ease-in-out infinite'}} viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="var(--text-primary)" strokeWidth="1.2" opacity="0.4"/>
          <rect x="8" y="7" width="2.5" height="8" rx="0.8" fill="var(--text-primary)" opacity="0.3"/>
          <rect x="12" y="7" width="2.5" height="8" rx="0.8" fill="var(--text-primary)" opacity="0.3"/>
        </svg>

        {/* Plus signs */}
        <svg className={styles.fi} style={{width:18,height:18,opacity:0.3,top:'30%',right:'5%',animation:'floatB 4.3s .3s ease-in-out infinite'}} viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="3" x2="9" y2="15" stroke="var(--color-mint-500)" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="3" y1="9" x2="15" y2="9" stroke="var(--color-mint-500)" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <svg className={styles.fi} style={{width:14,height:14,opacity:0.22,top:'70%',left:'8%',animation:'driftRight 5.4s .9s ease-in-out infinite'}} viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="3" x2="9" y2="15" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="3" y1="9" x2="15" y2="9" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <svg className={styles.fi} style={{width:12,height:12,opacity:0.2,top:'6%',left:'42%',animation:'floatA 4.1s 1.4s ease-in-out infinite'}} viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="3" x2="9" y2="15" stroke="#B07CED" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="3" y1="9" x2="15" y2="9" stroke="#B07CED" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>

        {/* Minus signs */}
        <svg className={styles.fi} style={{width:16,height:16,opacity:0.25,top:'44%',left:'3%',animation:'floatC 4.8s .6s ease-in-out infinite'}} viewBox="0 0 18 18" fill="none">
          <line x1="3" y1="9" x2="15" y2="9" stroke="#E85D50" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <svg className={styles.fi} style={{width:14,height:14,opacity:0.2,top:'78%',right:'14%',animation:'driftLeft 5.2s 1.2s ease-in-out infinite'}} viewBox="0 0 18 18" fill="none">
          <line x1="3" y1="9" x2="15" y2="9" stroke="#EF9F27" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <svg className={styles.fi} style={{width:12,height:12,opacity:0.22,top:'24%',right:'34%',animation:'floatB 4.5s .1s ease-in-out infinite'}} viewBox="0 0 18 18" fill="none">
          <line x1="3" y1="9" x2="15" y2="9" stroke="var(--text-primary)" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>

        {/* Mini cards */}
        <div className={`${styles.fi} ${styles.fiCard}`} style={{width:48,height:32,background:'var(--surface-elevated)',opacity:0.16,top:'22%',right:'4%',animation:'floatB 5.3s .4s ease-in-out infinite'}}>
          <div style={{margin:6,display:'flex',flexDirection:'column',gap:3}}>
            <div style={{height:2,width:'70%',borderRadius:1,background:'var(--color-mint-500)',opacity:0.6}} />
            <div style={{height:2,width:'50%',borderRadius:1,background:'var(--text-primary)',opacity:0.2}} />
          </div>
        </div>
        <div className={`${styles.fi} ${styles.fiCard}`} style={{width:44,height:28,background:'var(--surface-elevated)',opacity:0.12,top:'68%',left:'6%',animation:'floatC 5.6s 1.4s ease-in-out infinite'}}>
          <div style={{margin:5,display:'flex',flexDirection:'column',gap:2}}>
            <div style={{height:2,width:'65%',borderRadius:1,background:'#378ADD',opacity:0.5}} />
            <div style={{height:2,width:'45%',borderRadius:1,background:'var(--text-primary)',opacity:0.2}} />
          </div>
        </div>

      </div>
      {children}
    </div>
  );
}
