/**
 * @component ProgressRing
 * @description Cerc SVG animat care afiseaza procentul sarcinilor finalizate.
 * Foloseste stroke-dashoffset pentru animatia progresului (paradigma declarativa).
 *
 * @param {number} total     - numarul total de sarcini
 * @param {number} completed - numarul de sarcini finalizate
 */
export default function ProgressRing({ total, completed }) {
  const radius = 36;
  const stroke = 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  // Calculam procentul si offset-ul cercului
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Culoarea cercului in functie de progres
  const color =
    percentage === 100 ? "#16a34a" :   // verde - toate finalizate
    percentage >= 50   ? "#0ea5e9" :   // albastru - progres bun
                         "#f59e0b";    // galben - inceput

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center">
      <div className="bg-white rounded-full shadow-lg p-2 border border-slate-200">
        <svg height={radius * 2} width={radius * 2}>
          {/* Cercul de fundal (gri) */}
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Cercul de progres animat */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{
              transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease",
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
            }}
          />
          {/* Textul procentului */}
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill={color}
          >
            {percentage}%
          </text>
        </svg>
      </div>
      <span className="text-xs text-slate-500 mt-1 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
        {completed}/{total} done
      </span>
    </div>
  );
}
