import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the access prompt', () => {
    render(<App />);
    expect(screen.getByText('Bienvenue')).toBeInTheDocument();
  });
});
