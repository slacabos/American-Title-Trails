import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div>
      <div>Above</div>
      <Separator />
      <div>Below</div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', height: 80 }}>
      <div style={{ flex: 1 }}>Left</div>
      <Separator orientation="vertical" />
      <div style={{ flex: 1 }}>Right</div>
    </div>
  ),
}
