// @vitest-environment jsdom
import { act } from 'react';
import { expect, it } from 'vitest';
import { Icon } from './Icon';
import { IconButton } from '../IconButton';
import { setupDomTest } from '../../../test/setupDomTest';

const dom = setupDomTest();

it('makes icons decorative or named and keeps IconButton named (#12)', () => {
  act(() =>
    dom.root.render(
      <>
        <Icon name="plus" />
        <Icon name="trash" label="Delete" size={24} />
        <IconButton icon="close" aria-label="Close" />
      </>,
    ),
  );
  const icons = dom.host.querySelectorAll('svg');
  expect(icons[0].getAttribute('aria-hidden')).toBe('true');
  expect(icons[1].getAttribute('role')).toBe('img');
  expect(icons[1].getAttribute('aria-label')).toBe('Delete');
  expect(icons[1].getAttribute('width')).toBe('24');
  expect(dom.host.querySelector('button')?.getAttribute('aria-label')).toBe('Close');
  expect(icons[2].getAttribute('aria-hidden')).toBe('true');
});
