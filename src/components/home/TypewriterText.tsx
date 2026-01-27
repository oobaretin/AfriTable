"use client";

import * as React from "react";

interface TypewriterTextProps {
  words: string[];
  baseText: string;
  suffixText: string;
  className?: string;
}

export function TypewriterText({ words, baseText, suffixText, className = "" }: TypewriterTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [typingSpeed, setTypingSpeed] = React.useState(150);

  React.useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
          setTypingSpeed(150);
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(currentWord.slice(0, displayText.length - 1));
          setTypingSpeed(75);
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentWordIndex, words, typingSpeed]);

  return (
    <h1 className={className}>
      {baseText}{" "}
      <span className="text-orange-500 relative">
        {displayText}
        <span className="animate-pulse">|</span>
      </span>{" "}
      {suffixText}
    </h1>
  );
}
