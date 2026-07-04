interface DiffPreviewProps {
  before: string;
  after: string;
}

export function DiffPreview({ before, after }: DiffPreviewProps) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const maxLen = Math.max(beforeLines.length, afterLines.length);

  return (
    <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="text-xs font-medium text-stone-500">修改预览</p>
      <div className="max-h-64 overflow-y-auto font-mono text-xs leading-5">
        {Array.from({ length: maxLen }).map((_, i) => {
          const b = beforeLines[i];
          const a = afterLines[i];
          if (b === a) {
            return (
              <div key={i} className="text-stone-600">
                {a || " "}
              </div>
            );
          }
          return (
            <div key={i}>
              {b !== undefined && b !== a && (
                <div className="bg-red-100 text-red-800 line-through">{b}</div>
              )}
              {a !== undefined && a !== b && (
                <div className="bg-green-100 text-green-800">{a}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
