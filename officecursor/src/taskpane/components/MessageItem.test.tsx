import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageItem from './MessageItem'; // Assuming the merged component is here
import { Message } from '../contexts/AppContext';

// Mock the SecurityService
jest.mock('../services/securityService', () => ({
  SecurityService: {
    filterOutput: (content: string) => content,
  },
}));

// Mock Office availability
jest.mock('../services/officeService', () => ({
  isExcelAvailable: () => true,
  isWordAvailable: () => false,
}));

describe('MessageItem', () => {
  const mockOnCopy = jest.fn();
  const mockOnInsertToOffice = jest.fn();

  const userMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Hello, this is a user message.',
    timestamp: new Date(),
  };

  const assistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'Hello, this is an assistant message.',
    timestamp: new Date(),
  };

  const assistantMessageWithCode: Message = {
    id: '3',
    role: 'assistant',
    content: 'Here is some code:\n```javascript\nconsole.log("hello");\n```',
    timestamp: new Date(),
  };

  it('renders a user message correctly', () => {
    render(
      <MessageItem
        message={userMessage}
        onCopy={mockOnCopy}
        onInsertToOffice={mockOnInsertToOffice}
      />
    );

    expect(screen.getByText('Hello, this is a user message.')).toBeInTheDocument();
    // Avatar should not be present for user messages
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders an assistant message correctly with an avatar', () => {
    render(
      <MessageItem
        message={assistantMessage}
        onCopy={mockOnCopy}
        onInsertToOffice={mockOnInsertToOffice}
      />
    );

    expect(screen.getByText('Hello, this is an assistant message.')).toBeInTheDocument();
    // Avatar should be present for assistant messages
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders an assistant message with a code block', () => {
    render(
      <MessageItem
        message={assistantMessageWithCode}
        onCopy={mockOnCopy}
        onInsertToOffice={mockOnInsertToOffice}
      />
    );

    // Check for the text part
    expect(screen.getByText('Here is some code:')).toBeInTheDocument();
    
    // Check for the code inside the code block (react-simple-code-editor renders it in a textarea)
    const codeElement = screen.getByText('console.log("hello");');
    expect(codeElement).toBeInTheDocument();
    
    // Check for the copy button inside the code block
    expect(screen.getByTitle('复制代码')).toBeInTheDocument();
  });
}); 