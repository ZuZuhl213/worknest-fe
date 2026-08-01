import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Modal from './modal';

const ControlledModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [value, setValue] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test modal">
      <input aria-label="Email" value={value} onChange={(event) => setValue(event.target.value)} />
    </Modal>
  );
};

describe('Modal', () => {
  it('keeps focus in a controlled input while typing', async () => {
    const user = userEvent.setup();
    render(<ControlledModal />);
    const input = screen.getByRole('textbox', { name: 'Email' });

    await user.click(input);
    await user.type(input, 'member@example.com');

    expect(input).toHaveValue('member@example.com');
    expect(input).toHaveFocus();
  });
});
