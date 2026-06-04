import { render, screen } from '@testing-library/react';
import App from './App';

test('shows loading state on initial render', () => {
  render(<App />);
  expect(screen.getByText(/checking g train status/i)).toBeInTheDocument();
});
