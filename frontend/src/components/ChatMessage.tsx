import React from 'react';
import { Code2, FileText, Link as LinkIcon } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  timestamp: string;
  type?: 'text' | 'code' | 'markdown' | 'link' | 'file';
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isBot,
  timestamp,
  type = 'text',
  isLoading = false
}) => {
  const [displayedMessage, setDisplayedMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const typingSpeed = 20; // milliseconds per character
  const maxTypingDuration = 2000; // maximum typing animation duration in milliseconds

  React.useEffect(() => {
    if (!message) {
      setDisplayedMessage('');
      return;
    }

    if (isBot && !isLoading) {
      setIsTyping(true);
      setDisplayedMessage(''); // Reset the displayed message
      
      const characters = message.split('');
      const totalDuration = Math.min(characters.length * typingSpeed, maxTypingDuration);
      const intervalDelay = totalDuration / characters.length;
      
      let index = 0;
      const timer = setInterval(() => {
        if (index < characters.length) {
          setDisplayedMessage(prev => prev + characters[index]);
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
          // Ensure the complete message is shown
          setDisplayedMessage(message);
        }
      }, intervalDelay);

      return () => {
        clearInterval(timer);
        setDisplayedMessage(message); // Show full message on cleanup
      };
    } else {
      setDisplayedMessage(message);
      setIsTyping(false);
    }
  }, [message, isBot, isLoading]);

  const detectMessageType = (content: string): ChatMessageProps['type'] => {
    if (!content) return 'text';
    if (content.startsWith('```') && content.endsWith('```')) return 'code';
    if (content.startsWith('http://') || content.startsWith('https://')) return 'link';
    if (content.includes('*') || content.includes('#') || content.includes('_')) return 'markdown';
    return 'text';
  };

  const messageType = type || detectMessageType(message);
  const cleanMessage = displayedMessage.replace(/```/g, '');

  const LoadingIndicator = () => (
    <div className="flex space-x-2 p-2">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  const renderMessageContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    switch (messageType) {
      case 'code':
        return (
          <div className="relative">
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => navigator.clipboard.writeText(cleanMessage)}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-green-300 p-4 rounded-md overflow-x-auto font-mono text-sm">
              <code>{cleanMessage}</code>
            </pre>
          </div>
        );

      case 'link':
        return (
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            <a
              href={displayedMessage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-500 underline"
            >
              {displayedMessage}
            </a>
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
            <FileText className="w-4 h-4" />
            <span>{displayedMessage}</span>
          </div>
        );

      default:
        return (
          <p className="whitespace-pre-wrap break-words">
            {displayedMessage}
            {isTyping && <span className="animate-pulse">|</span>}
          </p>
        );
    }
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`
          rounded-lg p-4 max-w-[80%] shadow-md
          ${isBot
            ? 'bg-gray-800 text-gray-100'
            : 'bg-blue-600 text-white'
          }
        `}
      >
        {renderMessageContent()}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={`
            ${isBot ? 'text-gray-400' : 'text-blue-200'}
          `}>
            {timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};