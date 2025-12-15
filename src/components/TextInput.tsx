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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        자막 텍스트 입력
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
