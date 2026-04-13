import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders the home page with device cards', () => {
    render(<App />);

    expect(screen.getByText('Screenshot Maker')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create beautiful app screenshots/i })).toBeInTheDocument();
    expect(screen.getByText('App Store screenshots (1242×2688)')).toBeInTheDocument();
    expect(screen.getByText('App Store screenshots (2048×2732)')).toBeInTheDocument();
  });
});
