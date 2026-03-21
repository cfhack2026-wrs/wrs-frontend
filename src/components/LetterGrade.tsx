interface LetterGradeProps {
  score: number;
  size?: number;
}

function getLetterGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}

function getGradeColor(score: number): string {
  if (score >= 90) return 'var(--score-good)';
  if (score >= 70) return 'var(--score-ok)';
  return 'var(--score-bad)';
}

export function LetterGrade({ score, size = 56 }: LetterGradeProps) {
  const grade = getLetterGrade(score);
  const color = getGradeColor(score);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `${color}15`,
        border: `2px solid ${color}50`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Mono', monospace",
        fontSize: size * 0.45,
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}
      aria-label={`Grade: ${grade} (${score}%)`}
    >
      {grade}
    </div>
  );
}
