import React from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface FormattedTextProps {
  content: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ content, className = "" }) => {
  if (!content) return null;

  return (
    <div className={`formatted-math-text ${className}`}>
      <Markdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-black text-zinc-950">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

export default FormattedText;
