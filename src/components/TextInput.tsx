import { useState } from 'react';
import type { Line } from '@/models/line';
import { textToLines } from '@/utils/text-processor';

interface TextInputProps {
  onLinesChange: (lines: Line[]) => void;
}

export function TextInput({ onLinesChange }: TextInputProps) {
  const [text, setText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    const lines = textToLines(newText);
    onLinesChange(lines);
  };

  return (
    <div className="w-full">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        자막 텍스트 입력
        <span className="text-[10px] text-gray-500 border border-gray-200 rounded-full w-4 h-4 flex items-center justify-center cursor-help" title="각 줄이 하나의 자막으로 처리됩니다. 붙여넣기 후 바로 타임라인에 반영됩니다.">?</span>
      </label>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="자막 텍스트를 붙여넣으세요. 각 줄은 하나의 자막으로 처리됩니다."
        className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
    </div>
  );
}
