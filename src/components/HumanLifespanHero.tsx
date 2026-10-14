import React from 'react';
import { Compass } from 'lucide-react';
import { CountdownTime } from '../utils/dates';

interface HumanLifespanHeroProps {
  countdown?: CountdownTime;
}

// Keep the existing export compatible without assuming or persisting anyone's age.
export const HumanLifespanHero: React.FC<HumanLifespanHeroProps> = () => (
  <div className="dashboard-perspective">
    <Compass size={20} aria-hidden="true" />
    <div>
      <p className="dashboard-eyebrow">Una pausa para pensar</p>
      <p>¿Qué pequeño paso haría que hoy valiera la pena?</p>
    </div>
  </div>
);
