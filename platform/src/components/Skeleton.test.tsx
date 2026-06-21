import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Skeleton from './Skeleton';

describe('Skeleton Component', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Skeleton />);
    const skeletonDiv = container.firstChild as HTMLElement;

    expect(skeletonDiv).toBeInTheDocument();
    expect(skeletonDiv).toHaveStyle({
      width: '100%',
      height: '20px',
      borderRadius: '8px',
    });
  });

  it('accepts custom width and height', () => {
    const { container } = render(<Skeleton width="50px" height="50px" />);
    const skeletonDiv = container.firstChild as HTMLElement;

    expect(skeletonDiv).toHaveStyle({
      width: '50px',
      height: '50px',
    });
  });
});
