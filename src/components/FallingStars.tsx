"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./FallingStars.module.css";

const FallingStars = () => {
  const [stars, setStars] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const createStar = () => {
      const size = Math.random() * 2 + 1;
      const left = Math.random() * 100;
      const animationDuration = Math.random() * 5 + 5;
      const animationDelay = Math.random() * 5;

      return (
        <div
          key={Math.random()}
          className={styles.star}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            animationDuration: `${animationDuration}s`,
            animationDelay: `${animationDelay}s`,
          }}
        />
      );
    };

    const interval = setInterval(() => {
      setStars((prevStars) => [...prevStars.slice(-50), createStar()]);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const memoizedStars = useMemo(() => stars, [stars]);

  return <div className={styles.fallingStars}>{memoizedStars}</div>;
};

export default FallingStars;
