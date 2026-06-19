import React, { createContext, useCallback, useContext, useState } from 'react';
import type { NeuralMode } from '../types';

interface NeuralContextValue {
  neuralMode: NeuralMode;
  neuralIntensity: number;
  setNeuralMode: (mode: NeuralMode, intensity?: number) => void;
}

const NeuralContext = createContext<NeuralContextValue>({
  neuralMode: 'idle',
  neuralIntensity: 1,
  setNeuralMode: () => {},
});

export function NeuralProvider({ children }: { children: React.ReactNode }) {
  const [neuralMode, setMode] = useState<NeuralMode>('idle');
  const [neuralIntensity, setIntensity] = useState(1);

  const setNeuralMode = useCallback((mode: NeuralMode, intensity = 1) => {
    setMode(mode);
    setIntensity(intensity);
  }, []);

  return (
    <NeuralContext.Provider value={{ neuralMode, neuralIntensity, setNeuralMode }}>
      {children}
    </NeuralContext.Provider>
  );
}

export function useNeural() {
  return useContext(NeuralContext);
}
