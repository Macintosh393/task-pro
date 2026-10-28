// @vitest-environment jsdom
import { act } from 'react';
import { expect, it } from 'vitest';
import { Heading } from './Heading';
import { setupDomTest } from '../../../test/setupDomTest';

const dom = setupDomTest();

it('keeps heading semantics independent from visual size', () => {
  act(() =>
    dom.root.render(
      <Heading level={1} size="small">
        Title
      </Heading>,
    ),
  );
  expect(dom.host.querySelector('h1')?.textContent).toBe('Title');
});
