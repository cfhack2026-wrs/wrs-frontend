interface ScoreRingProps {
  score: number;
  size?: number;
}

function scoreColorVar(score: number): string {
  if (score >= 90) return 'var(--score-good)';
  if (score >= 50) return 'var(--score-ok)';
  return 'var(--score-bad)';
}

export function ScoreRing({ score, size = 88 }: ScoreRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = scoreColorVar(score);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Score: ${score} out of 100`}
      role="img"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(34,211,238,0.10)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        style={{ stroke: color }}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="score-arc"
      />
      {/* Score label */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size * 0.23}
        fontWeight="600"
        fontFamily="'DM Mono', monospace"
        style={{ fill: color }}
      >
        {score}
      </text>
    </svg>
  );
}
