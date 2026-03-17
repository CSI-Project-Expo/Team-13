import { useEffect, useRef, useState } from 'react';
import '../styles/Genie.css';

export default function Genie({ isHappy = true }) {
  const genieRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const mouthRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!leftEyeRef.current || !rightEyeRef.current) return;

      const leftEyeRect = leftEyeRef.current.getBoundingClientRect();
      const rightEyeRect = rightEyeRef.current.getBoundingClientRect();

      // Calculate center of each eye
      const leftEyeCenterX = leftEyeRect.width / 2;
      const leftEyeCenterY = leftEyeRect.height / 2;
      const rightEyeCenterX = rightEyeRect.width / 2;
      const rightEyeCenterY = rightEyeRect.height / 2;

      // Calculate angle from mouse to eye
      const leftAngle = Math.atan2(
        e.clientY - (leftEyeRect.top + leftEyeCenterY),
        e.clientX - (leftEyeRect.left + leftEyeCenterX)
      );
      const rightAngle = Math.atan2(
        e.clientY - (rightEyeRect.top + rightEyeCenterY),
        e.clientX - (rightEyeRect.left + rightEyeCenterX)
      );

      // Distance for pupil movement
      const distance = 8;

      const leftPupilX = Math.cos(leftAngle) * distance;
      const leftPupilY = Math.sin(leftAngle) * distance;
      const rightPupilX = Math.cos(rightAngle) * distance;
      const rightPupilY = Math.sin(rightAngle) * distance;

      leftEyeRef.current.style.setProperty(
        '--pupil-x',
        `${leftPupilX}px`
      );
      leftEyeRef.current.style.setProperty(
        '--pupil-y',
        `${leftPupilY}px`
      );
      rightEyeRef.current.style.setProperty(
        '--pupil-x',
        `${rightPupilX}px`
      );
      rightEyeRef.current.style.setProperty(
        '--pupil-y',
        `${rightPupilY}px`
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={genieRef} className={`genie-container ${isHappy ? 'genie--happy' : 'genie--sad'}`}>
      {/* Genie head */}
      <div className="genie-head">
        {/* Turban */}
        <div className="genie-turban"></div>

        {/* Face */}
        <div className="genie-face">
          <div className="genie-eyes">
            {/* Left eye */}
            <div ref={leftEyeRef} className="genie-eye">
              <div className="genie-pupil"></div>
            </div>

            {/* Right eye */}
            <div ref={rightEyeRef} className="genie-eye">
              <div className="genie-pupil"></div>
            </div>
          </div>

          {/* Mouth - Custom drawn */}
          <div ref={mouthRef} className={`genie-mouth ${!isHappy ? 'genie-mouth--sad' : 'genie-mouth--happy'}`}>
            <svg width="40" height="20" viewBox="0 0 40 20">
              {isHappy ? (
                <path
                  d="M 5 10 Q 20 18 35 10"
                  stroke="#2c3e50"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M 5 10 Q 20 2 35 10"
                  stroke="#d32f2f"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Hands that look like they grip the top edge of the card */}
      <div className="genie-arms">
        <div className="genie-arm genie-arm--left">
          <span className="genie-finger"></span>
          <span className="genie-finger"></span>
          <span className="genie-finger"></span>
        </div>
        <div className="genie-arm genie-arm--right">
          <span className="genie-finger"></span>
          <span className="genie-finger"></span>
          <span className="genie-finger"></span>
        </div>
      </div>
    </div>
  );
}

