import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders the screenshot composer entry screen', () => {
    render(<App />);

    expect(screen.getByText('Screenshot Composer')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create app store screenshots instantly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download all/i })).toBeInTheDocument();
  });
});
