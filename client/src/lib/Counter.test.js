import { render, screen, fireEvent } from '@testing-library/svelte'
import { expect, test } from 'vitest'
import Counter from './Counter.svelte'

test('starts at zero and increments on click', async () => {
  render(Counter)

  const button = screen.getByRole('button')
  expect(button).toHaveTextContent('Count is 0')

  await fireEvent.click(button)
  expect(button).toHaveTextContent('Count is 1')

  await fireEvent.click(button)
  expect(button).toHaveTextContent('Count is 2')
})
