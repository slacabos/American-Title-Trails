import type { Meta, StoryObj } from '@storybook/react'
import { ScrollArea } from './scroll-area'

const meta: Meta<typeof ScrollArea> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ width: 240, height: 120 }}>
      <ScrollArea>
        <div style={{ padding: 8 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ padding: 4 }}>
              Item {i + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
}
