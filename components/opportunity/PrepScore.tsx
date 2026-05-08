interface MissingItem {
  label: string;
  fix: string;
}

interface PrepScoreData {
  score: number;
  message: string;
  missing: MissingItem[];
}

interface PrepScoreProps {
  data: PrepScoreData;
}

function getScoreStyle(score: number): {
  bar: string;
  text: string;
  bg: string;
} {
  if (score >= 80)
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
    };
  if (score >= 50)
    return {
      bar: "bg-yellow-400",
      text: "text-yellow-700",
      bg: "bg-yellow-50",
    };
  return { bar: "bg-red-400", text: "text-red-700", bg: "bg-red-50" };
}

export default function PrepScore({ data }: PrepScoreProps) {
  const style = getScoreStyle(data.score);

  return (
    <div className={`rounded-xl border p-4 ${style.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">
          Score de préparation
        </h3>
        <span className={`text-2xl font-bold ${style.text}`}>
          {data.score}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-white rounded-full overflow-hidden mb-3 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${data.score}%` }}
        />
      </div>

      {/* Message */}
      <p className="text-xs text-gray-600 mb-4">{data.message}</p>

      {/* Missing items list */}
      {data.missing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Ce qu'il te manque
          </p>
          {data.missing.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 bg-white rounded-lg p-2 shadow-sm"
            >
              {/* Red dot indicator */}
              <span className="mt-0.5 h-2 w-2 rounded-full bg-red-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-800">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.fix}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All good state */}
      {data.missing.length === 0 && (
        <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm">
          <span className="text-emerald-500 text-lg">✓</span>
          <p className="text-xs font-medium text-emerald-700">
            Ton dossier est complet !
          </p>
        </div>
      )}
    </div>
  );
}
