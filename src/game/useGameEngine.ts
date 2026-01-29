import { useRef, useState, useEffect, useCallback } from 'react';

export function useGameEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Refs para rendimiento (sin re-renders)
  const playerY = useRef(0);
  const playerVel = useRef(0);
  const obstacles = useRef<{x: number, w: number, h: number}[]>([]);
  const frameRef = useRef(0);

  const jump = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
      setGameOver(false);
      obstacles.current = [];
      setScore(0);
    }
    if (playerY.current >= 0) { // Solo salta si está en el suelo (0)
        playerVel.current = -12;
    }
  }, [isPlaying]);

  return { isPlaying, score, gameOver, playerY, obstacles, jump, frameRef, setScore, setGameOver, setIsPlaying, playerVel };
}