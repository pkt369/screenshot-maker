import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IPAD_CONFIG } from '../devices/ipad';
import { IPHONE_CONFIG } from '../devices/iphone';
import { ComposerPage } from './ComposerPage';

vi.mock('./useCanvasRenderer', () => ({
  useMultiCanvasRenderer: () => ({
    mockupLoaded: true,
    mockupError: null,
    downloadAll: vi.fn(),
    downloadOne: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

function renderComposer(deviceName: 'iPhone' | 'iPad') {
  const deviceConfig = deviceName === 'iPhone' ? IPHONE_CONFIG : IPAD_CONFIG;

  return render(
    <MemoryRouter>
      <ComposerPage deviceConfig={deviceConfig} />
    </MemoryRouter>
  );
}

describe('ComposerPage', () => {
  it.each(['iPhone', 'iPad'] as const)('lets you adjust %s slide count down to one item', async (deviceName) => {
    const user = userEvent.setup();
    renderComposer(deviceName);

    expect(screen.getByText('3 / 6')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete slide 3' }));
    expect(screen.getByText('2 / 6')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete slide 2' }));
    expect(screen.getByText('1 / 6')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /Delete slide/i })).not.toBeInTheDocument();
  });

  it('caps the slide count at six items', async () => {
    const user = userEvent.setup();
    renderComposer('iPhone');

    const addButton = screen.getByRole('button', { name: '+ Add Slide' });

    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);

    expect(screen.getByText('6 / 6')).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it('lets you choose a headline font color', () => {
    renderComposer('iPhone');

    const colorInput = screen.getByLabelText('Headline color for slide 1');

    expect(colorInput).toHaveValue('#ffffff');

    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    expect(colorInput).toHaveValue('#ff0000');
  });

  it('keeps the preview constrained when only one slide remains', async () => {
    const user = userEvent.setup();
    const { container } = renderComposer('iPhone');

    await user.click(screen.getByRole('button', { name: 'Delete slide 3' }));
    await user.click(screen.getByRole('button', { name: 'Delete slide 2' }));

    const previewGrid = container.querySelector('.preview-grid');

    expect(previewGrid).toHaveClass('preview-grid-single');
  });
});
